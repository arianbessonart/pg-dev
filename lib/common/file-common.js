'use babel';


export default {

  getLine(editor, bufferPosition) {
    return editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
  }

}
