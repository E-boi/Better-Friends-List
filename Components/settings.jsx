const { React } = require('powercord/webpack');
const { SwitchItem } = require('powercord/components/settings');

module.exports = class betterfriendsSet extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = { category0Opened: false, category1Opened: false };
	}

	render() {
		const { getSetting, toggleSetting } = this.props;
		return (
			<>
				<SwitchItem value={getSetting('mutualGuilds', true)} onChange={() => toggleSetting('mutualGuilds')}>
					Add mutual servers in friend list
				</SwitchItem>
				<SwitchItem value={getSetting('sortOptions', true)} onChange={() => toggleSetting('sortOptions')}>
					Add sort options
				</SwitchItem>
				<SwitchItem value={getSetting('totalAmount', true)} onChange={() => toggleSetting('totalAmount')}>
					Add total amount for all/requested/blocked
				</SwitchItem>
				<SwitchItem value={getSetting('addSearch', true)} onChange={() => toggleSetting('addSearch')}>
					Add searchbar
				</SwitchItem>
				<SwitchItem value={getSetting('showFavorite', true)} onChange={() => toggleSetting('showFavorite')}>
					Show favorite friends
				</SwitchItem>
				<SwitchItem
					value={getSetting('friend_grid', true)}
					onChange={() => {
						toggleSetting('friend_grid');
						document.body.classList.toggle('grid');
					}}
				>
					Show friend list in grid
				</SwitchItem>
			</>
		);
	}
};
