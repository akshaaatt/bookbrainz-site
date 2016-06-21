'use strict';

const Promise = require('bluebird');

const express = require('express');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const handler = require('../helpers/handler');
const Achievement = require('../helpers/achievement');

const AchievementForm = React.createFactory(
	require('../../client/components/forms/achievementAdmin.jsx')
);

const router = express.Router();

router.get('/admin', (req, res) => {
	const markup = ReactDOMServer.renderToString(AchievementForm({}));
	res.render('achievement', {
		markup
	});
});

// XXX: need to authenticate admins once it is implemented
router.post('/admin/handler', (req, res) => {
	let achievement;
	let title;
	if (req.body.editor !== 'none') {
		const editorId = parseInt(req.body.editor, 10);
		if (req.body.achievement !== 'none') {
			const achievementId = parseInt(req.body.achievement, 10);
			achievement = Achievement.awardAchievement(editorId, achievementId)
				.then((unlock) => {
					let unlockJSON;
					if (unlock !== null) {
						unlockJSON = unlock.toJSON();
					}
					else {
						unlockJSON = {};
					}
					return unlockJSON;
				});
		}
		if (req.body.title !== 'none') {
			const titleId = parseInt(req.body.title, 10);
			title = Achievement.awardTitle(editorId, titleId)
				.then((unlock) => {
					let unlockJSON;
					if (unlock !== null) {
						unlockJSON = unlock.toJSON();
					}
					else {
						unlockJSON = {};
					}
					return unlockJSON;
				});
		}
	}
	const unlocks = Promise.join(
		achievement,
		title,
		(achievementJSON, titleJSON) => {
			const unlockJSON = {};
			unlockJSON.achievement = achievementJSON;
			unlockJSON.title = titleJSON;
			return unlockJSON;
		});
	handler.sendPromiseResult(res, unlocks);
});

module.exports = router;
