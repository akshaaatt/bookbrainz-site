/* eslint-disable prefer-arrow-callback,func-names */
/*
 * Copyright (C) 2021  Akash Gupta
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import {
	createEditor, createSeries, createWork,
	getRandomUUID, truncateEntities
} from '../../../test-helpers/create-entities';

import app from '../../../../src/api/app';
import {browseSeriesBasicTests} from '../helpers';
import chai from 'chai';
import chaiHttp from 'chai-http';
import orm from '../../../bookbrainz-data';


const {Relationship, RelationshipSet, RelationshipType, Revision} = orm;


chai.use(chaiHttp);
const {expect} = chai;


const aBBID = getRandomUUID();
const bBBID = getRandomUUID();
const inValidBBID = 'akjd-adjjk-23123';


describe('GET /Series', () => {
	before(() => createSeries(aBBID));
	after(truncateEntities);
	// Test to get basic information of an Series
	it('should get basic information of an Series', async function () {
		const res = await chai.request(app).get(`/series/${aBBID}`);
		expect(res.status).to.equal(200);
		expect(res.body).to.be.an('object');
		expect(res.body).to.have.all.keys(
			'seriesOrderingType',
			'seriesType',
			'bbid',
			'defaultAlias',
			'disambiguation'
		);
	 });

	 it('should return list of aliases of an Series', async function () {
		const res = await chai.request(app).get(`/series/${aBBID}/aliases`);
		expect(res.status).to.equal(200);
		expect(res.body).to.be.an('object');
		expect(res.body).to.have.all.keys(
			'bbid',
			'aliases'
		);
		expect(res.body.aliases).to.be.an('array');
		expect(res.body.aliases).to.have.lengthOf(1);
	 });

	 it('should return list of identifiers of an Series', async function () {
		const res = await chai.request(app).get(`/series/${aBBID}/identifiers`);
		expect(res.status).to.equal(200);
		expect(res.body).to.be.an('object');
		expect(res.body).to.have.all.keys(
			'bbid',
			'identifiers'
		);
		expect(res.body.identifiers).to.be.an('array');
		expect(res.body.identifiers).to.have.lengthOf(1);
	 });

	 it('should return list of relationships of an Series', async function () {
		const res = await chai.request(app).get(`/series/${aBBID}/relationships`);
		expect(res.status).to.equal(200);
		expect(res.body).to.be.an('object');
		expect(res.body).to.have.all.keys(
			'bbid',
			'relationships'
		);
		expect(res.body.relationships).to.be.an('array');
		expect(res.body.relationships).to.have.lengthOf(1);
	 });

	 it('should throw a 404 error if trying to access an series that does not exist', function (done) {
		chai.request(app)
			.get(`/series/${bBBID}`)
			.end(function (err, res) {
				if (err) { return done(err); }
				expect(res).to.have.status(404);
				expect(res.ok).to.be.false;
				expect(res.body).to.be.an('object');
				expect(res.body.message).to.equal('Series not found');
				return done();
			});
	 });

	it('should throw a 400 error if trying to access an series with invalid BBID', function (done) {
		chai.request(app)
			.get(`/series/${inValidBBID}`)
			.end(function (err, res) {
				if (err) { return done(err); }
				expect(res).to.have.status(400);
				expect(res.ok).to.be.false;
				expect(res.body).to.be.an('object');
				expect(res.body.message).to.equal('BBID is not valid uuid');
				return done();
			});
	 });

	 it('should throw a 404 error if trying to access identifiers of an Series that does not exist', function (done) {
		chai.request(app)
			.get(`/series/${bBBID}/identifiers`)
			.end(function (err, res) {
				if (err) { return done(err); }
				expect(res).to.have.status(404);
				expect(res.ok).to.be.false;
				expect(res.body).to.be.an('object');
				expect(res.body.message).to.equal('Series not found');
				return done();
			});
	 });


	it('should throw a 404 error if trying to access aliases of an Series that does not exist', function (done) {
		chai.request(app)
			.get(`/series/${bBBID}/aliases`)
			.end(function (err, res) {
				if (err) { return done(err); }
				expect(res).to.have.status(404);
				expect(res.ok).to.be.false;
				expect(res.body).to.be.an('object');
				expect(res.body.message).to.equal('Series not found');
				return done();
			});
	 });

	it('should throw a 404 error if trying to access relationships of an Series that does not exist', function (done) {
		chai.request(app)
			.get(`/series/${bBBID}/relationships`)
			.end(function (err, res) {
				if (err) { return done(err); }
				expect(res).to.have.status(404);
				expect(res.ok).to.be.false;
				expect(res.body).to.be.an('object');
				expect(res.body.message).to.equal('Series not found');
				return done();
			});
	 });
});

/* eslint-disable no-await-in-loop */
describe('Browse Series', () => {
	let work;
	before(async () => {
		// create a work which is related to 3 series
		const seriesBBIDs = [];
		for (let orderingTypeId = 1; orderingTypeId <= 3; orderingTypeId++) {
			const seriesBBID = getRandomUUID();
			const seriesAttribs = {
				bbid: seriesBBID,
				// Make type id alternate between "Automatic" (1) and "Manual" (2)
				orderingTypeId: (orderingTypeId % 2) + 1
			};
			await createSeries(seriesBBID, seriesAttribs);
			seriesBBIDs.push(seriesBBID);
		}
		work = await createWork();

		// Now create a revision which forms the relationship b/w work and series
		const editor = await createEditor();
		const revision = await new Revision({authorId: editor.id})
			.save(null, {method: 'insert'});

		const relationshipTypeData = {
			description: 'test descryption',
			id: 1,
			label: 'test label',
			linkPhrase: 'test phrase',
			reverseLinkPhrase: 'test reverse link phrase',
			sourceEntityType: 'Series',
			targetEntityType: 'Work'
		};
		await new RelationshipType(relationshipTypeData)
			.save(null, {method: 'insert'});

		const relationshipsPromise = [];
		for (const seriesBBID of seriesBBIDs) {
			const relationshipData = {
				sourceBbid: seriesBBID,
				targetBbid: work.get('bbid'),
				typeId: relationshipTypeData.id
			};
			relationshipsPromise.push(
				new Relationship(relationshipData)
					.save(null, {method: 'insert'})
			);
		}
		const relationships = await Promise.all(relationshipsPromise);

		const workRelationshipSet = await new RelationshipSet()
			.save(null, {method: 'insert'})
			.then((model) => model.relationships().attach(relationships).then(() => model));

		work.set('relationshipSetId', workRelationshipSet.id);
		work.set('revisionId', revision.id);
		await work.save(null, {method: 'update'});
	});
	after(truncateEntities);


	it('should throw an error if trying to browse more than one entity', (done) => {
		chai.request(app)
			.get(`/series?work=${work.get('bbid')}&edition=${work.get('bbid')}`)
			.end(function (err, res) {
				if (err) { return done(err); }
				expect(res).to.have.status(400);
				return done();
			});
	});

	it('should return list of series associated with the work (without any filter)', async () => {
		const res = await chai.request(app).get(`/series?work=${work.get('bbid')}`);
		await browseSeriesBasicTests(res);
		expect(res.body.series.length).to.equal(3);
	});

	it('should return list of series associated with the work (with Type filter)', async () => {
		const res = await chai.request(app).get(`/series?work=${work.get('bbid')}&orderingType=Automatic`);
		await browseSeriesBasicTests(res);
		expect(res.body.series.length).to.equal(1);
		expect(res.body.series[0].entity.seriesOrderingType).to.equal('Automatic');
	});

	it('should return 0 series (with Incorrect Type filter)', async () => {
		const res = await chai.request(app).get(`/series?work=${work.get('bbid')}&orderingType=wrongFilter`);
		await browseSeriesBasicTests(res);
		expect(res.body.series.length).to.equal(0);
	});

	it('should allow params to be case insensitive', async () => {
		const res = await chai.request(app).get(`/sErieS?WoRk=${work.get('bbid')}&OrDerIngTyPe=AuTomATiC`);
		await browseSeriesBasicTests(res);
		expect(res.body.series.length).to.equal(1);
		expect(res.body.series[0].entity.seriesOrderingType).to.equal('Automatic');
	});

	it('should NOT throw an error if there is no related entity', async () => {
		const work2 = await createWork();
		const res = await chai.request(app).get(`/series?work=${work2.get('bbid')}`);
		await browseSeriesBasicTests(res);
		expect(res.body.series.length).to.equal(0);
	});

	it('should throw 400 error for invalid bbid', (done) => {
		chai.request(app)
			.get('/series?work=1212121')
			.end(function (err, res) {
				if (err) { return done(err); }
				expect(res).to.have.status(400);
				return done();
			});
	});

	it('should throw 404 error for incorrect bbid', (done) => {
		chai.request(app)
			.get(`/series?work=${aBBID}`)
			.end(function (err, res) {
				if (err) { return done(err); }
				expect(res).to.have.status(404);
				return done();
			});
	});
});
