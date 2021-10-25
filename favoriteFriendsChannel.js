// ripped from https://github.com/powercord-community/betterfriends/blob/master/modules/FavoriteFriendChannel.js just taken out the parts I don't plan to need
const { inject } = require('powercord/injector');
const { React, getModule } = require('powercord/webpack');

const FavoriteFriends = require('./Components/FavoriteFriends');

module.exports = async function () {
	const _this = this;
	this.expanded = true;
	const ConnectedPrivateChannelsList = await getModule(m => m.default && m.default.displayName === 'ConnectedPrivateChannelsList');
	const channelStore = await getModule(['getChannel', 'getDMFromUserId']);
	const classes = {
		...(await getModule(['channel', 'closeButton'])),
		...(await getModule(['avatar', 'muted', 'selected'])),
		...(await getModule(['privateChannelsHeaderContainer'])),
	};
	const { lastMessageId } = getModule(['lastMessageId'], false);
	const { getDMFromUserId } = getModule(['getDMFromUserId'], false);
	const { DirectMessage } = getModule(['DirectMessage'], false);

	// Patch DM list
	inject('bfl-direct-messages', ConnectedPrivateChannelsList, 'default', (_, res) => {
		if (!this.settings.get('showFavorite', true)) return res;
		res.props.privateChannelIds = res.props.privateChannelIds.filter(c => {
			const channel = channelStore.getChannel(c);
			return channel.type !== 1 || !this.FAV_FRIENDS.includes(channel.recipients[0]);
		});

		if (this.favFriendsInstance) {
			this.favFriendsInstance.props.selectedChannelId = res.props.selectedChannelId;
			this.favFriendsInstance.props.FAV_FRIENDS = this.FAV_FRIENDS;
			this.favFriendsInstance.update?.();
		} else
			this.favFriendsInstance = React.createElement(FavoriteFriends, {
				classes,
				FAV_FRIENDS: this.FAV_FRIENDS,
				selectedChannelId: res.props.selectedChannelId,
				_this,
			});

		if (res.props.children.find(x => x?.toString()?.includes('this.favFriendsInstance'))) return res;
		const dms = this.favFriendsInstance.props.FAV_FRIENDS?.sort((a, b) => lastMessageId(getDMFromUserId(b)) - lastMessageId(getDMFromUserId(a))).map(
			userId => () =>
				channelStore.getChannel(getDMFromUserId(userId)) &&
				this.expanded &&
				React.createElement(DirectMessage, {
					'aria-posinset': 7,
					'aria-setsize': 54,
					tabIndex: -1,
					channel: channelStore.getChannel(getDMFromUserId(userId)),
					selected: res.props.selectedChannelId === getDMFromUserId(userId),
				})
		);
		res.props.children.push(() => this.favFriendsInstance, ...dms);

		return res;
	});
	ConnectedPrivateChannelsList.default.displayName = 'ConnectedPrivateChannelsList';
};
