/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var plotAttrs = require('../../plots/attributes');
var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var texttemplateAttrs = require('../../plots/template_attributes').texttemplateAttrs;

var colorScaleAttrs = require('../../components/colorscale/attributes');
var domainAttrs = require('../../plots/domain').attributes;
var pieAttrs = require('../pie/attributes');
var constants = require('./constants');
var extendFlat = require('../../lib/extend').extendFlat;

module.exports = {
    labels: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the labels of each of the sectors.'
        ].join(' ')
    },
    parents: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the parent sectors for each of the sectors.',
            'Empty string items \'\' are understood to reference',
            'the root node in the hierarchy.',
            'If `ids` is filled, `parents` items are understood to be "ids" themselves.',
            'When `ids` is not set, plotly attempts to find matching items in `labels`,',
            'but beware they must be unique.'
        ].join(' ')
    },

    values: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the values associated with each of the sectors.',
            'Use with `branchvalues` to determine how the values are summed.'
        ].join(' ')
    },
    branchvalues: {
        valType: 'enumerated',
        values: ['remainder', 'total'],
        dflt: 'remainder',
        editType: 'calc',
        role: 'info',
        description: [
            'Determines how the items in `values` are summed.',
            'When set to *total*, items in `values` are taken to be value of all its descendants.',
            'When set to *remainder*, items in `values` corresponding to the root and the branches sectors',
            'are taken to be the extra part not part of the sum of the values at their leaves.'
        ].join(' ')
    },
    count: {
        valType: 'flaglist',
        flags: [
            'branches',
            'leaves'
        ],
        dflt: 'leaves',
        editType: 'calc',
        role: 'info',
        description: [
            'Determines counting the number of *leaves* and/or *branches*,',
            'when a `values` array is not provided.'
        ].join(' ')
    },

    level: {
        valType: 'any',
        editType: 'plot',
        anim: true,
        role: 'info',
        description: [
            'Sets the level from which this trace hierarchy is rendered.',
            'Set `level` to `\'\'` to start from the root node in the hierarchy.',
            'Must be an "id" if `ids` is filled in, otherwise plotly attempts to find a matching',
            'item in `labels`.'
        ].join(' ')
    },
    maxdepth: {
        valType: 'integer',
        editType: 'plot',
        role: 'info',
        dflt: -1,
        description: [
            'Sets the number of rendered sectors from any given `level`.',
            'Set `maxdepth` to *-1* to render all the levels in the hierarchy.'
        ].join(' ')
    },

    marker: extendFlat({
        colors: {
            valType: 'data_array',
            editType: 'calc',
            description: [
                'Sets the color of each sector of this trace.',
                'If not specified, the default trace color set is used',
                'to pick the sector colors.'
            ].join(' ')
        },

        // colorinheritance: {
        //     valType: 'enumerated',
        //     values: ['per-branch', 'per-label', false]
        // },

        line: {
            color: extendFlat({}, pieAttrs.marker.line.color, {
                dflt: null,
                description: [
                    'Sets the color of the line enclosing each sector.',
                    'Defaults to the `paper_bgcolor` value.'
                ].join(' ')
            }),
            width: extendFlat({}, pieAttrs.marker.line.width, {dflt: 1}),
            editType: 'calc'
        },
        editType: 'calc'
    },
        colorScaleAttrs('marker', {
            colorAttr: 'colors',
            anim: false // TODO: set to anim: true?
        })
    ),

    leaf: {
        opacity: {
            valType: 'number',
            editType: 'style',
            role: 'style',
            min: 0,
            max: 1,
            description: [
                'Sets the opacity of the leaves. With colorscale',
                'it is defaulted to 1; otherwise it is defaulted to 0.7'
            ].join(' ')
        },
        editType: 'plot'
    },

    text: pieAttrs.text,
    textinfo: {
        valType: 'flaglist',
        role: 'info',
        flags: [
            'label',
            'text',
            'value',
            'current path',
            'percent root',
            'percent entry',
            'percent parent'
        ],
        extras: ['none'],
        editType: 'plot',
        description: [
            'Determines which trace information appear on the graph.'
        ].join(' ')
    },

    // TODO: incorporate `label` and `value` in the eventData
    texttemplate: texttemplateAttrs({editType: 'plot'}, {
        keys: constants.eventDataKeys.concat(['label', 'value'])
    }),

    hovertext: pieAttrs.hovertext,
    hoverinfo: extendFlat({}, plotAttrs.hoverinfo, {
        flags: [
            'label',
            'text',
            'value',
            'name',
            'current path',
            'percent root',
            'percent entry',
            'percent parent'
        ],
        dflt: 'label+text+value+name'
    }),
    hovertemplate: hovertemplateAttrs({}, {
        keys: constants.eventDataKeys
    }),

    textfont: pieAttrs.textfont,
    insidetextfont: pieAttrs.insidetextfont,
    outsidetextfont: pieAttrs.outsidetextfont,

    domain: domainAttrs({name: 'sunburst', trace: true, editType: 'calc'})
};
