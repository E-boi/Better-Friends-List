const { React } = require('powercord/webpack');

module.exports = class FavoriteFriends extends React.PureComponent {
	constructor(props) {
		super(props);

		this.state = { expanded: props._this.expanded ?? true };
		props.update = this.forceUpdate.bind(this);
	}

	render() {
		const { classes, FAV_FRIENDS, _this } = this.props;
		if (!classes || !FAV_FRIENDS || !FAV_FRIENDS.length) return null;

		return (
			<h2 className={`bf-fav-friends-header ${classes.privateChannelsHeaderContainer} container-2ax-kl`}>
				<span className={classes.headerText}>Favorite Friends</span>
				<svg
					className={`bf-expand-fav-friends ${this.state.expanded ? 'expanded' : 'collapsed'}`}
					height={15}
					width={15}
					viewBox='0 0 20 20'
					onClick={() => {
						_this.expanded = !this.state.expanded;
						this.setState({ expanded: _this.expanded });
						document.querySelector(`.scroller-1JbKMe`).dispatchEvent(new Event('focusin'));
						document.querySelector(`.scroller-1JbKMe`).dispatchEvent(new Event('focusout'));
					}}
				>
					<path
						fill='var(--channels-default)'
						d='M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z'
					/>
				</svg>
			</h2>
		);
	}
};
