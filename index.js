const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { findInTree } = require('powercord/util');
const { getModule, getModuleByDisplayName, constants, React } = require('powercord/webpack');
const { Tooltip } = require('powercord/components');

module.exports = class betterfriendslist extends Plugin {
	startPlugin() {
		this.loadStylesheet('style.css');
		const TabBar = getModuleByDisplayName('TabBar', false).prototype;
		const PeopleListItem = getModule(m => m.displayName === 'FriendRow', false).prototype;
		inject('bfl-tabbar', TabBar, 'render', (_, res) => {
			let relationships = getModule(['getRelationships'], false).__proto__.getRelationships(),
				relationshipCount = {};
			for (let type in constants.RelationshipTypes) relationshipCount[type] = 0;
			for (let id in relationships) relationshipCount[relationships[id]]++;
			for (let child of res.props.children)
				if (child && child.props.id != 'ADD_FRIEND') {
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

		inject('bfl-peoplelist', PeopleListItem, 'render', (args, res) => {
			if (typeof res.props.children === 'function') {
				if (res._owner.stateNode.props.mutualGuilds.length !== 0) {
					let childrenRender = res.props.children;
					res.props.children = (...args) => {
						let children = childrenRender(...args);
						children.props.children.splice(1, 0, React.createElement('div', { className: 'mutualGuilds-s7F2aa container-5VyO4t' }));
						res._owner.stateNode.props.mutualGuilds.forEach((guild, idx) => {
							const icon = React.createElement(Tooltip, {
								text: guild.name,
								position: 'top',
								children: React.createElement(
									'div',
									{
										className: res._owner.stateNode.props.mutualGuilds[idx + 1]
											? 'iconContainerMasked-G-akdf iconContainer-IBAtWs'
											: 'iconContainer-IBAtWs',
									},
									guild.icon
										? React.createElement('div', {
												className: 'icon-3o6xvg icon-r6DlKo iconSizeSmaller-2whVAO iconInactive-98JN5i',
												style: {
													backgroundImage: `url("https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp?size=256")`,
												},
										  })
										: React.createElement(
												'div',
												{
													className: 'icon-3o6xvg icon-r6DlKo iconSizeSmaller-2whVAO iconInactive-98JN5i noIcon-1a_FrS',
													style: { fontSize: '11px' },
												},
												React.createElement('div', { className: 'acronym-1e2Mdt' }, guild.acronym)
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

	pluginWillUnload() {
		uninject('bfl-tabbar');
		uninject('bfl-peoplelist');
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
