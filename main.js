/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

/** {brackets-extract} Extract Refactoring for Brackets
    Provides extract to variable and extract to method functionality for Brackets via an extension.
*/

define(function (require, exports, module) {
  'use strict';

  var CommandManager = brackets.getModule("command/CommandManager"),
    Menus = brackets.getModule("command/Menus");

  var COMMAND_ID = "me.drewbratcher.extract",
    CONTEXTUAL_COMMAND_ID = "me.drewbratcher.extractContextual";

  function extract() {
    console.log('extracting');
  }

  CommandManager.register("Extract", COMMAND_ID, extract);

  var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);

  var windowsCommand = {
    key: "Ctrl-Shift-E",
    platform: "win"
  };

  var macCommand = {
    key: "Cmd-Shift-E",
    platform: "mac"
  };

  var command = [windowsCommand, macCommand];

  menu.addMenuDivider();
  menu.addMenuItem(COMMAND_ID, command);

  CommandManager.register("Beautify", CONTEXTUAL_COMMAND_ID, extract);
  var contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
  contextMenu.addMenuItem(CONTEXTUAL_COMMAND_ID);

});
