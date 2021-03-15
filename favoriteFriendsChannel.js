// ripped from https://github.com/powercord-community/betterfriends/blob/master/modules/FavoriteFriendChannel.js just taken out the parts I don't plan to need
const { inject } = require('powercord/injector');
const { React, Flux, getModuleByDisplayName, getModule } = require('powercord/webpack');

const FavoriteFriends = require('./Components/FavoriteFriends');

module.exports = async function () {
	const _this = this;
	const PrivateChannel = await getModuleByDisplayName('PrivateChannel');
	const ConnectedPrivateChannelsList = await getModule(m => m.default && m.default.displayName === 'ConnectedPrivateChannelsList');
	const userStore = await getModule(['getUser', 'getCurrentUser']);
	const channelStore = await getModule(['getChannel', 'getDMFromUserId']);
	const activityStore = await getModule(['getPrimaryActivity']);
	const statusStore = await getModule(['getStatus']);
	const classes = {
		...(await getModule(['channel', 'closeButton'])),
		...(await getModule(['avatar', 'muted', 'selected'])),
		...(await getModule(['privateChannelsHeaderContainer'])),
	};

	// Build connected component
	const ConnectedPrivateChannel = Flux.connectStores(
		[userStore, channelStore, activityStore, statusStore, powercord.api.settings.store],
		({ userId, currentSelectedChannel }) => {
			const channelId = channelStore.getDMFromUserId(userId);
			const selected = currentSelectedChannel === channelId;
			const user = userStore.getUser(userId) || { id: '0', username: '???', isSystemUser: () => false, getAvatarURL: () => null, isSystemDM: () => false };

			const channel = channelId
				? channelStore.getChannel(channelId)
				: {
						id: '0',
						type: 1,
						isMultiUserDM: () => false,
						isSystemUser: () => false,
						isSystemDM: () => false,
						recipients: [user.id],
						toString: () => user.username,
				  };

			return {
				user,
				channel,
				selected,
				status: statusStore.getStatus(userId),
				isMobile: statusStore.isMobileOnline(userId),
				activities: activityStore.getActivities(userId),
				isFavFriends: true,
			};
		}
	)(PrivateChannel);

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
			() =>
				React.createElement(FavoriteFriends, { classes, ConnectedPrivateChannel, FAV_FRIENDS: this.FAV_FRIENDS, selectedChannelId: res.props.selectedChannelId, _this }),
		];

		return res;
	});
	ConnectedPrivateChannelsList.default.displayName = 'ConnectedPrivateChannelsList';
};
