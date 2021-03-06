const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { findInTree } = require('powercord/util');
const { getModule, getModuleByDisplayName, constants, React } = require('powercord/webpack');
const { Tooltip } = require('powercord/components');

module.exports = class betterfriendslist extends Plugin {
	startPlugin() {
		const TabBar = getModuleByDisplayName('TabBar', false).prototype;
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
	}

	pluginWillUnload() {
		uninject('bfl-tabbar');
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
