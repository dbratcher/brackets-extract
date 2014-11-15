/*global beforeEach, afterEach, describe, expect, it, spyOn, xdescribe, xit, define */
define( function( require, exports, module ) {
  "use strict";
  var main = require("main");

  describe('Extract Refactoring', function() {
    describe('extractVariables', function() {
      it('should be exposed', function() {
        expect(main.extractVariables).not.toBeNull();
      });
      it('should work on simple code', function() {
        var params = main.extractVariables('var x = hey + 1;');
        expect(params[0]).toMatch('hey');
        expect(params.length).toEqual(1);
      });
      it('should work on throw', function() {
        var params = main.extractVariables('throw a;');
        expect(params[0]).toMatch('a');
        expect(params.length).toEqual(1);
      });
      it('should work on calls and assigns', function() {
        var params = main.extractVariables('var x = a;\nx.callSomething();');
        expect(params[0]).toMatch('a');
        expect(params.length).toEqual(1);
      });
      it('should work with returns', function() {
        var params = main.extractVariables('var x = 1;\nreturn x;');
        expect(params.length).toEqual(0);
      });
      it('should work with complex code', function() {
         var code = ['var controllerBefore = controller.controller.before;',
           'if (controllerBefore !== undefined) {',
           'if (controllerBefore instanceof Array) {',
           'beforeActions = beforeActions.concat(controllerBefore);',
           '} else {',
           'beforeActions.push(controllerBefore);',
           '}\n};\n}'].join('\n');
        var params = main.extractVariables(code);
        expect(params[0]).toMatch('controller');
        expect(params[1]).toMatch('beforeActions');
        expect(params.length).toEqual(2);
      });
    });
  });
});
