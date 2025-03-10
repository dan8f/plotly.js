/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var Registry = require('../../registry');
var appendArrayPointValue = require('../../components/fx/helpers').appendArrayPointValue;
var Fx = require('../../components/fx');
var Lib = require('../../lib');
var Events = require('../../lib/events');

var helpers = require('./helpers');
var pieHelpers = require('../pie/helpers');

var formatValue = pieHelpers.formatPieValue;

module.exports = function attachFxHandlers(sliceTop, entry, gd, cd, opts) {
    var cd0 = cd[0];
    var trace = cd0.trace;
    var hierarchy = cd0.hierarchy;
    var rootLabel = hierarchy.data.data.pid;
    var readLabel = function(refPt) {
        var l = helpers.getPtLabel(refPt);
        return l === undefined ? rootLabel : l;
    };

    var isSunburst = trace.type === 'sunburst';
    var isTreemap = trace.type === 'treemap';

    // hover state vars
    // have we drawn a hover label, so it should be cleared later
    if(!('_hasHoverLabel' in trace)) trace._hasHoverLabel = false;
    // have we emitted a hover event, so later an unhover event should be emitted
    // note that click events do not depend on this - you can still get them
    // with hovermode: false or if you were earlier dragging, then clicked
    // in the same slice that you moused up in
    if(!('_hasHoverEvent' in trace)) trace._hasHoverEvent = false;

    var onMouseOver = function(pt) {
        var fullLayoutNow = gd._fullLayout;

        if(gd._dragging || fullLayoutNow.hovermode === false) return;

        var traceNow = gd._fullData[trace.index];
        var cdi = pt.data.data;
        var ptNumber = cdi.i;
        var isRoot = helpers.isHierarchyRoot(pt);
        var parent = helpers.getParent(hierarchy, pt);

        var val = helpers.getVal(pt);

        var _cast = function(astr) {
            return Lib.castOption(traceNow, ptNumber, astr);
        };

        var hovertemplate = _cast('hovertemplate');
        var hoverinfo = Fx.castHoverinfo(traceNow, fullLayoutNow, ptNumber);
        var separators = fullLayoutNow.separators;

        if(hovertemplate || (hoverinfo && hoverinfo !== 'none' && hoverinfo !== 'skip')) {
            var hoverCenterX;
            var hoverCenterY;
            if(isSunburst) {
                hoverCenterX = cd0.cx + pt.pxmid[0] * (1 - pt.rInscribed);
                hoverCenterY = cd0.cy + pt.pxmid[1] * (1 - pt.rInscribed);
            }
            if(isTreemap) {
                hoverCenterX = pt._hoverX;
                hoverCenterY = pt._hoverY;
            }

            var hoverPt = {};
            var parts = [];
            var thisText = [];
            var hasFlag = function(flag) { return parts.indexOf(flag) !== -1; };

            if(hoverinfo) {
                parts = hoverinfo === 'all' ?
                    traceNow._module.attributes.hoverinfo.flags :
                    hoverinfo.split('+');
            }

            hoverPt.label = cdi.label;
            if(hasFlag('label') && hoverPt.label) thisText.push(hoverPt.label);

            if(cdi.hasOwnProperty('v')) {
                hoverPt.value = cdi.v;
                hoverPt.valueLabel = formatValue(hoverPt.value, separators);
                if(hasFlag('value')) thisText.push(hoverPt.valueLabel);
            }

            hoverPt.currentPath = pt.currentPath = helpers.getPath(pt.data);
            if(hasFlag('current path') && !isRoot) {
                thisText.push(hoverPt.currentPath);
            }

            var tx;
            var allPercents = [];
            var insertPercent = function() {
                if(allPercents.indexOf(tx) === -1) { // no need to add redundant info
                    thisText.push(tx);
                    allPercents.push(tx);
                }
            };

            if(parent) {
                hoverPt.percentParent = pt.percentParent = val / helpers.getVal(parent);
                hoverPt.parent = pt.parentString = readLabel(parent);
                if(hasFlag('percent parent')) {
                    tx = helpers.formatPercent(hoverPt.percentParent, separators) + ' of ' + hoverPt.parent;
                    insertPercent();
                }
            }

            hoverPt.percentEntry = pt.percentEntry = val / helpers.getVal(entry);
            hoverPt.entry = pt.entry = readLabel(entry);
            if(hasFlag('percent entry') && !isRoot && !pt.onPathbar) {
                tx = helpers.formatPercent(hoverPt.percentEntry, separators) + ' of ' + hoverPt.entry;
                insertPercent();
            }

            hoverPt.percentRoot = pt.percentRoot = val / helpers.getVal(hierarchy);
            hoverPt.root = pt.root = readLabel(hierarchy);
            if(hasFlag('percent root') && !isRoot) {
                tx = helpers.formatPercent(hoverPt.percentRoot, separators) + ' of ' + hoverPt.root;
                insertPercent();
            }

            hoverPt.text = _cast('hovertext') || _cast('text');
            if(hasFlag('text')) {
                tx = hoverPt.text;
                if(Lib.isValidTextValue(tx)) thisText.push(tx);
            }

            var hoverItems = {
                trace: traceNow,
                y: hoverCenterY,
                text: thisText.join('<br>'),
                name: (hovertemplate || hasFlag('name')) ? traceNow.name : undefined,
                color: _cast('hoverlabel.bgcolor') || cdi.color,
                borderColor: _cast('hoverlabel.bordercolor'),
                fontFamily: _cast('hoverlabel.font.family'),
                fontSize: _cast('hoverlabel.font.size'),
                fontColor: _cast('hoverlabel.font.color'),
                nameLength: _cast('hoverlabel.namelength'),
                textAlign: _cast('hoverlabel.align'),
                hovertemplate: hovertemplate,
                hovertemplateLabels: hoverPt,
                eventData: [makeEventData(pt, traceNow, opts.eventDataKeys)]
            };

            if(isSunburst) {
                hoverItems.x0 = hoverCenterX - pt.rInscribed * pt.rpx1;
                hoverItems.x1 = hoverCenterX + pt.rInscribed * pt.rpx1;
                hoverItems.idealAlign = pt.pxmid[0] < 0 ? 'left' : 'right';
            }
            if(isTreemap) {
                hoverItems.x = hoverCenterX;
                hoverItems.idealAlign = hoverCenterX < 0 ? 'left' : 'right';
            }

            Fx.loneHover(hoverItems, {
                container: fullLayoutNow._hoverlayer.node(),
                outerContainer: fullLayoutNow._paper.node(),
                gd: gd
            });

            trace._hasHoverLabel = true;
        }

        if(isTreemap) {
            var slice = sliceTop.select('path.surface');
            opts.styleOne(slice, pt, traceNow, {
                hovered: true
            });
        }

        trace._hasHoverEvent = true;
        gd.emit('plotly_hover', {
            points: [makeEventData(pt, traceNow, opts.eventDataKeys)],
            event: d3.event
        });
    };

    var onMouseOut = function(evt) {
        var fullLayoutNow = gd._fullLayout;
        var traceNow = gd._fullData[trace.index];
        var pt = d3.select(this).datum();

        if(trace._hasHoverEvent) {
            evt.originalEvent = d3.event;
            gd.emit('plotly_unhover', {
                points: [makeEventData(pt, traceNow, opts.eventDataKeys)],
                event: d3.event
            });
            trace._hasHoverEvent = false;
        }

        if(trace._hasHoverLabel) {
            Fx.loneUnhover(fullLayoutNow._hoverlayer.node());
            trace._hasHoverLabel = false;
        }

        if(isTreemap) {
            var slice = sliceTop.select('path.surface');
            opts.styleOne(slice, pt, traceNow, {
                hovered: false
            });
        }
    };

    var onClick = function(pt) {
        // TODO: this does not support right-click. If we want to support it, we
        // would likely need to change pie to use dragElement instead of straight
        // mapbox event binding. Or perhaps better, make a simple wrapper with the
        // right mousedown, mousemove, and mouseup handlers just for a left/right click
        // mapbox would use this too.
        var fullLayoutNow = gd._fullLayout;
        var traceNow = gd._fullData[trace.index];

        var clickVal = Events.triggerHandler(gd, 'plotly_' + trace.type + 'click', {
            points: [makeEventData(pt, traceNow, opts.eventDataKeys)],
            event: d3.event
        });

        // 'regular' click event when sunburst/treemap click is disabled or when
        // clicking on leaves or the hierarchy root
        if(
            clickVal === false ||
            isSunburst && (
                helpers.isHierarchyRoot(pt) ||
                helpers.isLeaf(pt)
            )
        ) {
            if(fullLayoutNow.hovermode) {
                gd._hoverdata = [makeEventData(pt, traceNow, opts.eventDataKeys)];
                Fx.click(gd, d3.event);
            }
            return;
        }

        // skip if triggered from dragging a nearby cartesian subplot
        if(gd._dragging) return;

        // skip during transitions, to avoid potential bugs
        // we could remove this check later
        if(gd._transitioning) return;

        // store 'old' level in guiEdit stash, so that subsequent Plotly.react
        // calls with the same uirevision can start from the same entry
        Registry.call('_storeDirectGUIEdit', traceNow, fullLayoutNow._tracePreGUI[traceNow.uid], {
            level: traceNow.level
        });

        var id = helpers.getPtId(pt);
        var nextEntry = helpers.isEntry(pt) ?
            helpers.findEntryWithChild(hierarchy, id) :
            helpers.findEntryWithLevel(hierarchy, id);

        var frame = {
            data: [{level: helpers.getPtId(nextEntry)}],
            traces: [trace.index]
        };

        var animOpts = {
            frame: {
                redraw: false,
                duration: opts.transitionTime
            },
            transition: {
                duration: opts.transitionTime,
                easing: opts.transitionEasing
            },
            mode: 'immediate',
            fromcurrent: true
        };

        Fx.loneUnhover(fullLayoutNow._hoverlayer.node());
        Registry.call('animate', gd, frame, animOpts);
    };

    sliceTop.on('mouseover', onMouseOver);
    sliceTop.on('mouseout', onMouseOut);
    sliceTop.on('click', onClick);
};

function makeEventData(pt, trace, keys) {
    var cdi = pt.data.data;

    var out = {
        curveNumber: trace.index,
        pointNumber: cdi.i,
        data: trace._input,
        fullData: trace,

        // TODO more things like 'children', 'siblings', 'hierarchy?
    };

    for(var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if(key in pt) out[key] = pt[key];
    }
    // handle special case of parent
    if('parentString' in pt) out.parent = pt.parentString;

    appendArrayPointValue(out, trace, cdi.i);

    return out;
}
