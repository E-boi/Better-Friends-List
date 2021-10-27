const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { findInTree } = require('powercord/util');
const {
	getModule,
	getModuleByDisplayName,
	constants,
	React,
	i18n: { Messages },
} = require('powercord/webpack');
const {
	Tooltip,
	Flex,
	Icon,
	settings: { SwitchItem },
} = require('powercord/components');
const Settings = require('./Components/settings');

module.exports = class betterfriendslist extends Plugin {
	startPlugin() {
		powercord.api.notices.sendAnnouncement(Date.now().toString(), {
			message: React.createElement(
				'div',
				null,
				'Better Friends List is deprecated in favor of ',
				React.createElement('a', { href: 'https://github.com/Bricklou/powercord-pindms', target: '_blank' }, 'pin dms'),
				'.'
			),
			color: 'red',
			button: { onClick: () => powercord.pluginManager.disable('Better-Friends-List'), text: 'Disable plugin' },
		});
		return;
		if (this.settings.get('friend_grid', true)) this.loadStylesheet('friendgrid.scss');
		else this.loadStylesheet('style.scss');
		this.peopleList = ['PeopleListSectionedNonLazy', 'PeopleListSectionedLazy'];
		this.contextMenus = ['DMUserContextMenu', 'GuildChannelUserContextMenu', 'UserGenericContextMenu', 'GroupDMUserContextMenu'];
		powercord.api.settings.registerSettings(this.entityID, {
			category: this.entityID,
			label: 'Better Friends List',
			render: Settings,
		});

		this.FAV_FRIENDS = this.settings.get('favoriteFriends');
		if (!this.FAV_FRIENDS) {
			this.settings.set('favoriteFriends', []);
			this.FAV_FRIENDS = [];
		}

		this._injectTabBar();
		this._injectFriendRow();

		for (const module of this.contextMenus) {
			this._injectContextMenu(module);
		}

		for (const module of this.peopleList) {
			this._injectPeopleList(module);
		}

		require('./favoriteFriendsChannel').bind(this)();
	}

	pluginWillUnload() {
		this.peopleList.forEach(peopleList => uninject(`bfl-${peopleList}`));
		this.contextMenus.forEach(menuName => uninject(`bfl-${menuName}`));
		uninject('bfl-personList');
		uninject('bfl-tabbar');
		uninject('bfl-peoplelist');
		uninject('bfl-direct-messages');
		powercord.api.settings.unregisterSettings(this.entityID);
	}

	_injectTabBar() {
		const _this = this;
		const TabBar = getModuleByDisplayName('TabBar', false).prototype;
		inject('bfl-tabbar', TabBar, 'render', (_, res) => {
			if (res.props['aria-label'] !== Messages.FRIENDS) return res; // fix so only tab bar in friends list gets inject into
			if (!_this.settings.get('totalAmount', true)) return res;
			let relationships = getModule(['getRelationships'], false).__proto__.getRelationships(),
				relationshipCount = {};
			for (let type in constants.RelationshipTypes) relationshipCount[type] = 0;
			for (let id in relationships) relationshipCount[relationships[id]]++;
			for (let child of res.props.children)
				if (child && child.props.id !== Messages.ADD_FRIEND) {
					const newChildren = [child.props.children].flat().filter(child => findInTree(child, 'type.displayName') != 'NumberBadge');
					switch (child.props.id) {
						case 'ALL':
							newChildren[0] += ` - ${relationshipCount[constants.RelationshipTypes.FRIEND]}`;
							break;
						case 'ONLINE':
							newChildren[0] += ` - ${
								Object.entries(relationships).filter(
									n =>
										n[1] === constants.RelationshipTypes.FRIEND && getModule(['getStatus'], false).getStatus(n[0]) !== constants.StatusTypes.OFFLINE
								).length
							}`;
							break;
						case 'PENDING':
							newChildren[0] += ' - ';
							newChildren.splice(
								1,
								1,
								React.createElement(Tooltip, {
									text: 'Incoming',
									position: 'bottom',
									children: React.createElement(Icon, { className: 'bfl-down', name: 'ArrowDropDown', height: '20' }),
								})
							);
							newChildren.splice(2, 1, relationshipCount[constants.RelationshipTypes.PENDING_INCOMING]);
							newChildren.splice(
								3,
								1,
								React.createElement(Tooltip, {
									text: 'Outgoing',
									position: 'bottom',
									children: React.createElement(Icon, { className: 'bfl-down', height: '20', name: 'ArrowDropUp' }),
								})
							);
							newChildren.splice(4, 1, relationshipCount[constants.RelationshipTypes.PENDING_OUTGOING]);
							break;
						case 'BLOCKED':
							newChildren[0] += ` - ${relationshipCount[constants.RelationshipTypes.BLOCKED]}`;
							break;
					}
					child.props.children = newChildren;
				}
			return res;
		});
	}

	_injectFriendRow() {
		const FriendRow = getModule(m => m.displayName === 'FriendRow', false).prototype;
		inject('bfl-peoplelist', FriendRow, 'render', (_, res) => {
			if (!this.settings.get('mutualGuilds', true)) return res;
			if (typeof res.props.children === 'function') {
				if (res._owner.stateNode.props.mutualGuilds.length !== 0) {
					const childrenRender = res.props.children;
					const Guild = getModule(['GuildIcon'], false);
					res.props.children = (...args) => {
						const children = childrenRender(...args);
						children.props.children.splice(1, 0, React.createElement('div', { className: 'bfl-mutualGuilds bfl-container' }));
						res._owner.stateNode.props.mutualGuilds.forEach((guild, idx) => {
							const icon = React.createElement(Tooltip, {
								text: guild.name,
								position: 'top',
								children: React.createElement(
									'div',
									{
										className: getModule(['iconContainer'], false).iconContainer,
									},
									guild.icon
										? React.createElement(Guild.GuildIcon, {
												size: Guild.GuildIcon.Sizes.SMALLER,
												guild,
												style: {
													backgroundImage: `url("https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp?size=256")`,
												},
										  })
										: React.createElement(
												Guild.GuildIcon,
												{
													size: Guild.GuildIcon.Sizes.SMALLER,
													guild: guild,
													className: getModule(['noIcon'], false).noIcon,
													style: { fontSize: '11px' },
												},
												React.createElement('div', { className: getModule(['noIcon'], false).acronym }, guild.acronym)
										  )
								),
							});
							if (!children.props.children[1].props.children) children.props.children[1].props.children = [icon];
							else children.props.children[1].props.children.push(icon);
						});
						return children;
					};
				}
			}
			return res;
		});
	}

	_injectContextMenu(moduleName) {
		const Menu = getModule(['MenuItem'], false);
		const UserContextMenu = getModule(m => m.default?.displayName === moduleName, false);
		const { getFriendIDs } = getModule(['getRelationships'], false);
		const isFriend = id => {
			const friendIDs = getFriendIDs();
			return friendIDs.includes(id);
		};
		const isFavFriend = id => this.FAV_FRIENDS.includes(id);
		inject(`bfl-${moduleName}`, UserContextMenu, 'default', ([{ user }], res) => {
			if (!this.settings.get('showFavorite', true)) return res;
			let addFavButton;
			if (!isFavFriend(user.id) && isFriend(user.id)) {
				addFavButton = React.createElement(Menu.MenuItem, {
					action: () => {
						this.FAV_FRIENDS.push(user.id);
						this.settings.set('favoriteFriends', this.FAV_FRIENDS);
						// if (this.favFriendsInstance) this.favFriendsInstance.forceUpdate();
					},
					id: 'bfl-AddfavFriend',
					label: 'Add to favorite friends',
				});
			} else if (isFavFriend(user.id)) {
				addFavButton = React.createElement(Menu.MenuItem, {
					action: () => {
						this.FAV_FRIENDS = this.FAV_FRIENDS.filter(a => a !== user.id);
						this.settings.set('favoriteFriends', this.FAV_FRIENDS);
					},
					id: 'bfl-RemovefavFriend',
					label: 'Remove favorite friend',
				});
			}
			if (!addFavButton) return res;
			const userContextMenuItems = res.props.children.props.children;
			const group = userContextMenuItems.find(
				child => Array.isArray(child.props?.children) && child.props.children.find(ch => ch?.props?.id === 'block')
			);

			if (group) {
				group.props.children.push(addFavButton);
			} else {
				userContextMenuItems.push(React.createElement(Menu.MenuGroup, null, addFavButton));
			}
			return res;
		});
		UserContextMenu.default.displayName = moduleName;
	}

	_injectPeopleList(moduleName) {
		let sortKey,
			sortReversed,
			searchQuery = '';
		const statusSortOrder = {
			online: 0,
			streaming: 1,
			idle: 2,
			dnd: 3,
			offline: 4,
			invisible: 5,
			unknown: 6,
		};
		const PeopleList = getModule(m => m.default?.displayName === moduleName, false);
		inject(`bfl-${moduleName}`, PeopleList, 'default', (args, res) => {
			const headers = getModule(['headerCell'], false);
			let childrenRender = res.props.children.props.children;
			const title = args[0].getSectionTitle(args[0].statusSections, 0);
			res.props.children.props.children = (...args) => {
				let children = childrenRender(...args);
				if (!children.props.children) return children;
				children.props.children[0].props.children[0] = [
					React.createElement(
						'div',
						{ className: 'bfl-headerTitle bfl-container' },
						React.createElement(Flex, {
							align: Flex.Align.CENTER,
							children: [
								React.createElement('div', { className: 'bfl-title', children: [title] }),
								this.settings.get('sortOptions', true) &&
									[
										{ key: 'usernameLower', label: Messages.FRIENDS_COLUMN_NAME },
										{ key: 'statusIndex', label: Messages.FRIENDS_COLUMN_STATUS },
									]
										.filter(n => n)
										.map(data =>
											React.createElement('div', {
												className: [
													'bfl-header bfl-nameCell',
													headers.headerCell,
													sortKey === data.key && headers.headerCellSorted,
													headers.clickable,
												].join(' '),
												children: React.createElement('div', {
													className: headers.headerCellContent,
													children: [
														data.label,
														sortKey === data.key &&
															React.createElement(Icon, { className: headers.sortIcon, name: sortReversed ? 'ArrowDropDown' : 'ArrowDropUp' }),
													].filter(n => n),
												}),
												onClick: () => {
													if (sortKey === data.key) {
														if (!sortReversed) sortReversed = true;
														else {
															sortKey = null;
															sortReversed = false;
														}
													} else {
														sortKey = data.key;
														sortReversed = false;
													}
													this.rerenderList();
												},
											})
										),
								this.settings.get('showFavorite', true) &&
									React.createElement('div', {
										className: [
											'bfl-header bfl-nameCell',
											headers.headerCell,
											sortKey === 'isFavorite' && headers.headerCellSorted,
											headers.clickable,
										].join(' '),
										children: React.createElement('div', {
											className: headers.headerCellContent,
											children: [
												'Favorite',
												sortKey === 'isFavorite' &&
													React.createElement(Icon, { className: headers.sortIcon, name: sortReversed ? 'ArrowDropDown' : 'ArrowDropUp' }),
											].filter(n => n),
										}),
										onClick: () => {
											if (sortKey === 'isFavorite') {
												if (!sortReversed) sortReversed = true;
												else {
													sortKey = null;
													sortReversed = false;
												}
											} else {
												sortKey = 'isFavorite';
												sortReversed = false;
											}
											this.rerenderList();
										},
									}),
								this.settings.get('addSearch', true) &&
									React.createElement(Flex.Child, {
										children: React.createElement('div', {
											children: React.createElement('input', {
												className: getModule(['input'], false).input,
												placeholder: Messages.SEARCH,
												value: searchQuery,
												onChange: change => {
													searchQuery = change.target.value;
													this.rerenderList();
												},
											}),
										}),
									}),
							]
								.flat(10)
								.filter(n => n),
						})
					),
				];
				children.props.children[0].props.children = [].concat(children.props.children[0].props.children).map(section => {
					if (!section[0].key) return section;
					let newSection = [].concat(section);
					if (sortKey || searchQuery) {
						if (searchQuery) {
							let usedSearchQuery = searchQuery.toLowerCase();
							newSection = newSection.filter(
								user => user && typeof user.props.usernameLower == 'string' && user.props.usernameLower.indexOf(usedSearchQuery) > -1
							);
						}
						if (sortKey) {
							newSection = newSection.map(user =>
								Object.assign({}, user, {
									statusIndex: statusSortOrder[user.props.status],
									isFavorite: this.FAV_FRIENDS.includes(user.props.user.id),
								})
							);
							if (sortKey === 'isFavorite') newSection = newSection.filter(user => user.isFavorite);
							else
								newSection.sort((x, y) => {
									let xValue = sortKey === 'statusIndex' ? x[sortKey] : x.props[sortKey],
										yValue = sortKey === 'statusIndex' ? y[sortKey] : y.props[sortKey];
									return xValue < yValue ? -1 : xValue > yValue ? 1 : 0;
								});
						}
					}
					if (sortReversed) newSection.reverse();
					return newSection;
				});
				return children;
			};
			return res;
		});
		PeopleList.default.displayName = moduleName;
	}

	rerenderList() {
		const button = document.querySelector(`.tabBar-ZmDY9v .selected-3s45Ha`);
		if (button) button.click();
	}

	createBadge(amount, text) {
		let badge = React.createElement(getModule(['NumberBadge'], false).NumberBadge, {
			count: amount,
			style: { marginLeft: 6 },
		});
		return text
			? React.createElement(Tooltip, {
					text: text,
					position: 'bottom',
					children: badge,
			  })
			: badge;
	}
};
