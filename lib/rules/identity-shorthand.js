/**
 * @fileoverview Rule to check if the identity shorthand can be used
 */
'use strict';

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------


module.exports = function (context) {
    var _ = require('lodash');
    var lodashUtil = require('../util/lodashUtil');
    var astUtil = require('../util/astUtil');
    var settings = require('../util/settingsUtil').getSettings(context);

    var supportsProp = require('../util/methodDataUtil').getPropShorthandMethods(settings.version);

    function isExplicitIdentityFunction(iteratee) {
        var firstParamName = astUtil.getFirstParamName(iteratee);
        return firstParamName && _.get(astUtil.getValueReturnedInFirstLine(iteratee), 'name') === firstParamName;
    }

    var isLodashIdentityFunction = _.matches({
        type: 'MemberExpression',
        object: {name: settings.pragma},
        property: {name: 'identity'}
    });

    var canUseIdentityShorthand = _.overSome(isExplicitIdentityFunction, isLodashIdentityFunction);

    function methodSupportsShorthand(node) {
        return _.includes(supportsProp, astUtil.getMethodName(node));
    }

    var callExpressionReporters = {
        always: function (node, iteratee) {
            if (methodSupportsShorthand(node) && canUseIdentityShorthand(iteratee)) {
                context.report({
                    node: iteratee,
                    message: 'Prefer omitting the iteratee over a function that returns its argument'
                });
            }
        },
        never: function (node, iteratee) {
            if (methodSupportsShorthand(node) && !iteratee) {
                context.report(node.callee.property, 'Do not use the identity shorthand syntax');
            }
        }
    };

    return {
        CallExpression: lodashUtil.getLodashMethodVisitor(settings, callExpressionReporters[context.options[0] || 'always'])
    };
};

module.exports.schema = [
    {
        enum: ['always', 'never']
    }
];