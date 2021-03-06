swrap = require './selection-wrapper'

module.exports =
class HoverManager
  constructor: (@vimState) ->
    {@editor, @editorElement} = @vimState
    @container = document.createElement('div')
    @decorationOptions = {type: 'overlay', item: @container}
    @reset()

  getPoint: ->
    if @vimState.isMode('visual', 'blockwise')
      # FIXME #179
      @vimState.getLastBlockwiseSelection()?.getHeadSelection().getHeadBufferPosition()
    else
      swrapOptions = {fromProperty: true, allowFallback: true}
      swrap(@editor.getLastSelection()).getBufferPositionFor('head', swrapOptions)

  set: (text, point=@getPoint(), options={}) ->
    unless @marker?
      @marker = @editor.markBufferPosition(point)
      @editor.decorateMarker(@marker, @decorationOptions)

    if options.classList?.length
      @container.classList.add(options.classList...)
    @container.textContent = text

  reset: ->
    @container.className = 'vim-mode-plus-hover'
    @marker?.destroy()
    @marker = null

  destroy: ->
    {@vimState} = {}
    @reset()
