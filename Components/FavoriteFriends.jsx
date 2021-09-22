// ripped from https://github.com/powercord-community/betterfriends/blob/master/components/FavoriteFriends.jsx
const { getModule, React } = require('powercord/webpack');

module.exports = class FavoriteFriends extends React.PureComponent {
	constructor(props) {
		super(props);

		this.state = { expanded: props._this.expanded ?? true };
		props._this.favFriendsInstance = this;
	}

	componentWillUnmount() {
		delete this.props._this.favFriendsInstance;
	}

	render() {
		const { classes, FAV_FRIENDS, _this } = this.props;
		if (!classes || !FAV_FRIENDS || !FAV_FRIENDS.length) return null;
		const { lastMessageId } = getModule(['lastMessageId'], false);
		const { getDMFromUserId } = getModule(['getDMFromUserId'], false);
		const { getChannel } = getModule(['getChannel'], false);
		const { DirectMessage } = getModule(['DirectMessage'], false);

		return [
			// Header
			<h2 className={`${classes.privateChannelsHeaderContainer} container-2ax-kl`}>
				<span className={classes.headerText}>Favorite Friends</span>
				<svg
					className={`${this.state.expanded ? 'expanded' : 'collapsed'} ${getModule(['headerCell'], false).clickable}`}
					height={15}
					width={15}
					viewBox='0 0 20 20'
					onClick={() => {
						_this.expanded = !this.state.expanded;
						this.setState({ expanded: _this.expanded });
					}}
				>
					<path
						fill='var(--channels-default)'
						d='M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z'
					/>
				</svg>
			</h2>,
			// Friends
			this.state.expanded
				? FAV_FRIENDS.sort((a, b) => lastMessageId(getDMFromUserId(b)) - lastMessageId(getDMFromUserId(a))).map(
						userId =>
							getChannel(getDMFromUserId(userId)) && (
								<DirectMessage
									aria-posinset={7}
									aria-setsize={54}
									tabIndex={-1}
									channel={getChannel(getDMFromUserId(userId))}
									selected={this.props.selectedChannelId === getDMFromUserId(userId)}
								/>
							)
				  )
				: null,
		];
	}
};
