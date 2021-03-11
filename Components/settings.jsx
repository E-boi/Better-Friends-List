const { React } = require('powercord/webpack');
const { SwitchItem } = require('powercord/components/settings');

module.exports = class betterfriendsSet extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = { category0Opened: false, category1Opened: false };
	}

	render() {
		const { getSetting, toggleSetting, updateSetting } = this.props;
		return (
			<>
				<SwitchItem value={getSetting('mutualGuilds')} onChange={() => toggleSetting('mutualGuilds')}>
					Add mutual servers in friend list
				</SwitchItem>
				<SwitchItem value={getSetting('sortOptions')} onChange={() => toggleSetting('sortOptions')}>
					Add sort options
				</SwitchItem>
				<SwitchItem value={getSetting('totalAmount')} onChange={() => toggleSetting('totalAmount')}>
					Add total amount for all/requested/blocked
				</SwitchItem>
				<SwitchItem value={getSetting('addSearch')} onChange={() => toggleSetting('addSearch')}>
					Add searchbar
				</SwitchItem>
			</>
		);
	}
};
