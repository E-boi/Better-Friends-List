const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { findInTree } = require('powercord/util');
const { getModule, getModuleByDisplayName, constants, React, i18n } = require('powercord/webpack');
const { Tooltip, Flex, Icon } = require('powercord/components');
const Settings = require('./Components/settings');

module.exports = class betterfriendslist extends Plugin {
	startPlugin() {
		this.loadStylesheet('style.css');
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
		powercord.api.settings.registerSettings(this.entityID, {
			category: this.entityID,
			label: 'Better Friends List',
			render: Settings,
		});
		this.settings.get('mutualGuilds', true), this.settings.get('sortOptions', true), this.settings.get('totalAmount', true), this.settings.get('addSearch', true);

		const TabBar = getModuleByDisplayName('TabBar', false).prototype;
		const FriendRow = getModule(m => m.displayName === 'FriendRow', false).prototype;
		const PeopleListNoneLazy = getModule(m => m.default?.displayName === 'PeopleListSectionedNonLazy', false);

		inject('bfl-tabbar', TabBar, 'render', (_, res) => {
			if (res.props['aria-label'] !== 'Friends') return res; // fix so only tab bar in friends list gets inject into
			if (!this.settings.get('totalAmount')) return res;
			let relationships = getModule(['getRelationships'], false).__proto__.getRelationships(),
				relationshipCount = {};
			for (let type in constants.RelationshipTypes) relationshipCount[type] = 0;
			for (let id in relationships) relationshipCount[relationships[id]]++;
			for (let child of res.props.children)
				if (child && child.props.id !== 'ADD_FRIEND') {
					const newChildren = [child.props.children].flat().filter(child => findInTree(child, 'type.displayName') != 'NumberBadge');
					switch (child.props.id) {
						case 'ALL':
							newChildren.push(this.createBadge(relationshipCount[constants.RelationshipTypes.FRIEND]));
							break;
						case 'ONLINE':
							newChildren.push(this.createBadge(getModule(['getOnlineFriendCount'], false).__proto__.getOnlineFriendCount()));
							break;
						case 'PENDING':
							newChildren.push(this.createBadge(relationshipCount[constants.RelationshipTypes.PENDING_INCOMING], 'Incoming'));
							newChildren.push(this.createBadge(relationshipCount[constants.RelationshipTypes.PENDING_OUTGOING], 'Outgoing'));
							break;
						case 'BLOCKED':
							newChildren.push(this.createBadge(relationshipCount[constants.RelationshipTypes.BLOCKED]));
							break;
					}
					child.props.children = newChildren;
				}
			return res;
		});

		inject('bfl-peoplelist', FriendRow, 'render', (_, res) => {
			if (!this.settings.get('mutualGuilds')) return res;
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
												guild: guild,
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

		inject('bfl-personList', PeopleListNoneLazy, 'default', (args, res) => {
			const headers = getModule(['headerCell'], false);
			let childrenRender = res.props.children.props.children;
			const title = args[0].getSectionTitle(args[0].statusSections, 0);
			res.props.children.props.children = (...args) => {
				let children = childrenRender(...args);
				children.props.children[0].props.children[0] = [
					React.createElement(
						'div',
						{ className: 'title-30qZAO container-2ax-kl' },
						React.createElement(Flex, {
							align: Flex.Align.CENTER,
							children: [
								React.createElement('div', { className: 'bfl-title', children: [title] }),
								this.settings.get('sortOptions') &&
									[
										{ key: 'usernameLower', label: i18n._proxyContext.messages.FRIENDS_COLUMN_NAME },
										{ key: 'statusIndex', label: i18n._proxyContext.messages.FRIENDS_COLUMN_STATUS },
									]
										.filter(n => n)
										.map(data =>
											React.createElement('div', {
												className: ['bfl-header bfl-nameCell', headers.headerCell, sortKey === data.key && headers.headerCellSorted, headers.clickable].join(' '),
												children: React.createElement('div', {
													className: headers.headerCellContent,
													children: [
														data.label,
														sortKey === data.key && React.createElement(Icon, { className: headers.sortIcon, name: Icon.Names[sortReversed ? 10 : 9] }),
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
								this.settings.get('addSearch') && // Search add but no functionally
									React.createElement(Flex.Child, {
										children: React.createElement('div', {
											children: React.createElement('input', {
												className: getModule(['input'], false).input,
												placeholder: 'Search',
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
							newSection = newSection.filter(user => user && typeof user.props.usernameLower == 'string' && user.props.usernameLower.indexOf(usedSearchQuery) > -1);
						}
						if (sortKey) {
							newSection = newSection
								.map(user => Object.assign({}, user, { statusIndex: statusSortOrder[user.props.status] }))
								.sort((x, y) => {
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
		PeopleListNoneLazy.default.displayName = 'PeopleListSectionedNonLazy';
	}

	pluginWillUnload() {
		uninject('bfl-personList');
		uninject('bfl-tabbar');
		uninject('bfl-peoplelist');
		powercord.api.settings.unregisterSettings(this.entityID);
	}

	rerenderList() {
		const button = document.querySelector(`.tabBar-ZmDY9v .selected-3s45Ha`);
		if (button) button.click();
	}

	createBadge(amount, text) {
		let badge = React.createElement(getModule(['NumberBadge'], false).NumberBadge, {
			className: getModule(['badge'], false).badge,
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
