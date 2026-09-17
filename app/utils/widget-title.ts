export function widgetTitle(widget: { type: string, name: string, settings: Record<string, any> }, t: (key: string) => string) {
  if (widget.name) return widget.name
  const base = t(`widgets.${widget.type}.name`)
  return widget.type === 'scene' ? `${base}: ${t(`options.mode.${widget.settings.mode}`)}` : base
}
