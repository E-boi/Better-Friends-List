// ripped from https://github.com/powercord-community/betterfriends/blob/master/modules/FavoriteFriendChannel.js just taken out the parts I don't plan to need
const { inject } = require('powercord/injector');
const { React, getModule } = require('powercord/webpack');

const FavoriteFriends = require('./Components/FavoriteFriends');

module.exports = async function () {
	const _this = this;
	const ConnectedPrivateChannelsList = await getModule(m => m.default && m.default.displayName === 'ConnectedPrivateChannelsList');
	const channelStore = await getModule(['getChannel', 'getDMFromUserId']);
	const classes = {
		...(await getModule(['channel', 'closeButton'])),
		...(await getModule(['avatar', 'muted', 'selected'])),
		...(await getModule(['privateChannelsHeaderContainer'])),
	};

	// Patch DM list
	inject('bfl-direct-messages', ConnectedPrivateChannelsList, 'default', (_, res) => {
		if (!this.settings.get('showFavorite', true)) return res;
		res.props.privateChannelIds = res.props.privateChannelIds.filter(c => {
			const channel = channelStore.getChannel(c);
			return channel.type !== 1 || !this.FAV_FRIENDS.includes(channel.recipients[0]);
		});

		if (this.favFriendsInstance) this.favFriendsInstance.forceUpdate();

		res.props.children = [
			// Previous elements
			...res.props.children,
			// Favorite Friends
			() => {
				if (res.props.listRef.current.getItems?.()[0] && res.props.listRef.current.getItems?.()[0]?.type !== 'section') return null;
				return React.createElement(FavoriteFriends, {
					classes,
					FAV_FRIENDS: this.FAV_FRIENDS,
					selectedChannelId: res.props.selectedChannelId,
					_this,
				});
			},
		];

		return res;
	});
	ConnectedPrivateChannelsList.default.displayName = 'ConnectedPrivateChannelsList';
};
