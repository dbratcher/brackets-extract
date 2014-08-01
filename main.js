/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

/** {brackets-extract} Extract Refactoring for Brackets
    Provides extract to variable and extract to method functionality for Brackets via an extension.
*/

define(function (require, exports, module) {
  'use strict';

  var CommandManager = brackets.getModule("command/CommandManager"),
    Menus = brackets.getModule("command/Menus"),
    EditorManager = brackets.getModule("editor/EditorManager"),
    Editor = brackets.getModule("editor/Editor").Editor,
    Dialogs = brackets.getModule("widgets/Dialogs"),
    DefaultDialogs = brackets.getModule("widgets/DefaultDialogs"),
    DocumentManager = brackets.getModule("document/DocumentManager");

  var COMMAND_ID = "me.drewbratcher.extract",
    CONTEXTUAL_COMMAND_ID = "me.drewbratcher.extractContextual";

  var dialog = require("text!dialog.html");

  function extract() {
    var indentChar, indentSize, formattedText;
    var unformattedText, isSelection = false;
    var useTabs = Editor.getUseTabChar();

    if (useTabs) {
      indentChar = '\t';
      indentSize = 1;
    } else {
      indentChar = ' ';
      indentSize = Editor.getSpaceUnits();
    }

    var editor = EditorManager.getCurrentFullEditor();
    var selectedText = editor.getSelectedText();
    var selection = editor.getSelection();

    if (selectedText.length > 0) {
      isSelection = true;
      unformattedText = selectedText;
    } else {
      Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_ERR, "Extract Refactoring Error", "You must highligh some code for extraction.");
      return;
    }

    var doc = DocumentManager.getCurrentDocument();

    var language = doc.getLanguage();
    var fileType = language._id;

    switch (fileType) {

    case 'javascript':
      Dialogs.showModalDialogUsingTemplate(dialog).done(function (id) {
        console.log(id);
      });
      break;
    default:
      Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_ERR, "Extract Refactoring Error", "Unsupported File: Must be Javascript.");
      return;
    }
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
