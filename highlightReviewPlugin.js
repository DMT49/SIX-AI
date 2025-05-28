/* Toast UI Editor inline “review highlight” plugin
   turns  ==text==  ⇄  <mark class="review-hl">text</mark>
------------------------------------------------------------*/
export default function highlightReviewPlugin() {
  return (editor) => {
    /* ① WYSIWYG command — wraps / unwraps selection */
    editor.commandManager.addCommand('wysiwyg', {
      name: 'toggleReviewHighlight',
      exec(wEditor) {
        const html = wEditor.getSelectedHTML();
        if (!html) return;

        // is the selection *already* wrapped?
        const temp = document.createElement('div');
        temp.innerHTML = html.trim();
        const first = temp.firstChild;

        if (
          first &&
          first.nodeName === 'MARK' &&
          first.classList.contains('review-hl')
        ) {
          // unwrap
          wEditor.replaceSelection(first.innerHTML);
        } else {
          // wrap
          wEditor.wrapSelectionWith(
            '<mark class="review-hl">', '</mark>'
          );
        }
      }
    });

    /* ② MD → HTML (viewer / preview) */
    editor.convertor.addMdRule('review_open', {
      type   : 'text',
      regexp : /==(?=[^=\n]+)==?/,
      toHtml : () => '@@REVIEW_OPEN@@'
    });
    editor.convertor.addMdRule('review_close', {
      type   : 'text',
      regexp : /==/ ,
      toHtml : () => '@@REVIEW_CLOSE@@'
    });
    editor.convertor.addHtmlRule('review_html', {
      matcher (node) { return node.nodeValue?.includes('@@REVIEW_OPEN@@'); },
      replacer(node) {
        return node.nodeValue
          .replace('@@REVIEW_OPEN@@','<mark class="review-hl">')
          .replace('@@REVIEW_CLOSE@@','</mark>');
      }
    });

    /* ③ HTML → MD (switching to Markdown tab / saving) */
    editor.convertor.addNodeInfo({
      nodeName :'mark',
      test     : el => el.classList.contains('review-hl'),
      fromNode : ({ children }) => `==${children}==`
    });
  };
}
