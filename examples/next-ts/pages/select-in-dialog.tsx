import { normalizeProps, Portal, useMachine } from "@zag-js/react"
import * as select from "@zag-js/select"
import * as dialog from "@zag-js/dialog"
import { selectData } from "@zag-js/shared"
import { useId } from "react"

function Select() {
  const [state, send] = useMachine(select.machine({ id: useId(), name: "country" }))
  const api = select.connect(state, send, normalizeProps)

  return (
    <>
      <div className="control">
        <label {...api.labelProps}>Label</label>
        <button {...api.triggerProps}>
          <span>{api.selectedOption?.label ?? "Select option"}</span>
        </button>
      </div>

      <div {...api.positionerProps}>
        <ul {...api.contentProps}>
          {selectData.map(({ label, value }) => (
            <li key={value} {...api.getOptionProps({ label, value })}>
              <span>{label}</span>
              {value === api.selectedOption?.value && "✓"}
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export default function Page() {
  const [state, send] = useMachine(dialog.machine({ id: useId() }))
  const api = dialog.connect(state, send, normalizeProps)
  return (
    <div style={{ padding: "20px" }}>
      <button {...api.triggerProps} data-testid="trigger-1">
        Open Dialog
      </button>
      {api.isOpen && (
        <Portal>
          <div {...api.backdropProps} />
          <div data-testid="container-1" {...api.containerProps}>
            <div {...api.contentProps}>
              <h2 {...api.titleProps}>Edit profile</h2>
              <p {...api.descriptionProps}>Make changes to your profile here. Click save when you are done.</p>
              <Select />
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
