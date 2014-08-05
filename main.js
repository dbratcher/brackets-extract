/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, Mustache */

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
      Strings = require("i18n!nls/strings"),
      BracketsStrings = brackets.getModule("i18n!nls/strings");

  var COMMAND_ID = "me.drewbratcher.extract",
      CONTEXTUAL_COMMAND_ID = "me.drewbratcher.extractContextual";

  var dialog = require("text!dialog.html");
  var templateVars = {
    BracketsStrings: BracketsStrings,
    Strings: Strings
  };

  function extract() {
    var unformattedText;
    var editor = EditorManager.getCurrentFullEditor();
    var selectedText = editor.getSelectedText();

    if (selectedText.length > 0) {
      unformattedText = selectedText;
    } else {
      Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_ERR, Strings.DIALOG_ERROR_TITLE, Strings.DIALOG_ERROR_NO_SELECTION);
      return;
    }

    if (editor.document.language.getId() === "javascript") {
      var openedDialog = Dialogs.showModalDialogUsingTemplate(Mustache.render(dialog, templateVars));
      var $dom = openedDialog.getElement();
      $dom.find('#newName').select();
      openedDialog.done(function (id) {
        if (id == "save") {
          var newName = $dom.find("#newName").val();
          var varOrFunc = $dom.find("#varOrFunc:checked").val();
          //var replace = $dom.find("#replace").val();
          newName = newName.trim();
          unformattedText = unformattedText.trim();
          if (unformattedText.substr(unformattedText.length - 1) != ';') {
            unformattedText = unformattedText + ';';
          }
          var newText;
          if (varOrFunc == 'variable') {
            newText = "var " + newName + " = " + unformattedText + "\n";
          } else {
            newName = newName + '()';
            newText = [
              "function " + newName + " {",
              unformattedText,
              "}"
            ];
          }
          performExtraction(newName, newText);
        }
      });
    } else {
        Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_ERR, Strings.DIALOG_ERROR_TITLE, Strings.DIALOG_ERROR_UNSUPPORTED_FILE);
        return;
    }
  }

  function performExtraction(newName, newText) {
    var editor = EditorManager.getCurrentFullEditor(),
        cursor = editor.getCursorPos(),
        scroll = editor.getScrollPos(),
        doc = editor.document,
        selection = editor.getSelection();
    var originalLine = doc.getLine(selection.start.line);
    var lineText = originalLine.trimLeft();
    var numSpaces = originalLine.length - lineText.length;
    var indent = originalLine.substr(0, numSpaces);

    if (newText instanceof Array) {
      newText = newText.join('\n' + indent) + '\n';
    }
    doc.batchOperation(function () {
      doc.replaceRange(newName, selection.start, selection.end);
      var newStart = selection.start;
      newStart.ch = 0;
      doc.replaceRange(indent + newText, newStart, newStart);
    });
  }

  CommandManager.register(Strings.COMMAND_NAME, COMMAND_ID, extract);

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

  CommandManager.register(Strings.COMMAND_NAME, CONTEXTUAL_COMMAND_ID, extract);
  var contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
  contextMenu.addMenuItem(CONTEXTUAL_COMMAND_ID);

});
