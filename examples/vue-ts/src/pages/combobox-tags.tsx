import * as combobox from "@zag-js/combobox"
import * as tagsInput from "@zag-js/tags-input"
import { comboboxTagsControls, comboboxData } from "@zag-js/shared"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/vue"
import { computed, defineComponent, ref } from "vue"
import { StateVisualizer } from "../components/state-visualizer"
import { Toolbar } from "../components/toolbar"
import { useControls } from "../hooks/use-controls"
import type { OptionProps } from "@zag-js/combobox/src/combobox.types"

function toDashCase(str: string) {
  return str.replace(/\s+/g, "-").toLowerCase()
}

function optionsInclude(options: { label: string }[], value: string) {
  return options.some((item) => item.label.toLowerCase() === value.toLowerCase())
}

export default defineComponent({
  name: "ComboboxTags",
  setup() {
    const controls = useControls(comboboxTagsControls)
    const options = ref(comboboxData)
    const comboboxOptions = ref(comboboxData)

    const addValueToOptionsIfNeeded = (value: string) => {
      if (!optionsInclude(comboboxOptions.value, value)) {
        comboboxOptions.value.push({
          label: value,
          code: value,
        })
      }
    }

    const [tagsState, tagsSend] = useMachine(
      tagsInput.machine({
        id: "combobox",
        ids: {
          input: "combobox-tags",
        },
        value: [comboboxData[0].label, comboboxData[1].label],
        allowEditTag: false,
        onChange({ values }) {
          const latestValue = values[values.length - 1]
          if (latestValue != null) {
            addValueToOptionsIfNeeded(latestValue)
          }
        },
      }),
      { context: controls.context },
    )
    const tagsApiRef = computed(() => tagsInput.connect(tagsState.value, tagsSend, normalizeProps))

    const [comboboxState, comboboxSend] = useMachine(
      combobox.machine({
        id: "combobox",
        ids: {
          input: "combobox-tags",
        },
        inputBehavior: "autohighlight",
        onOpen() {
          options.value = [...comboboxOptions.value]
        },
        onInputChange({ value }) {
          const filtered = comboboxOptions.value.filter((item) =>
            item.label.toLowerCase().includes(value.toLowerCase()),
          )
          const newOptions = filtered.length > 0 ? filtered : [...comboboxOptions.value]
          if (value && !optionsInclude(newOptions, value)) {
            newOptions.unshift({
              label: value,
              code: value,
            })
          }
          options.value = [...newOptions]
        },
        onSelect({ label: newValue }) {
          if (newValue == null) {
            return
          }
          const oldValues = [...tagsApiRef.value.value]
          const valueIndex = oldValues.indexOf(newValue)
          if (valueIndex > -1) {
            oldValues.splice(valueIndex, 1)
            tagsApiRef.value.setValue(oldValues)
          } else {
            tagsApiRef.value.setValue([...oldValues, newValue])
          }
          comboboxApiRef.value.clearValue()
        },
      }),
      { context: controls.context },
    )

    const comboboxApiRef = computed(() => combobox.connect(comboboxState.value, comboboxSend, normalizeProps))

    const inputProps = computed(() => {
      const tagsProps = tagsApiRef.value.inputProps
      const comboboxProps = comboboxApiRef.value.inputProps

      function onKeydown(event: KeyboardEvent) {
        comboboxProps?.onKeydown?.(event)

        // Adding tags with enter is handled by combobox onSelect when open
        if (comboboxApiRef.value.isOpen && event.key === "Enter") {
          return
        }
        tagsProps?.onKeydown?.(event)
      }

      return { ...mergeProps(tagsProps, comboboxProps), onKeydown }
    })

    const isSelected = (label: string) => tagsApiRef.value.value.includes(label)

    const getOptionProps = (option: OptionProps) => ({
      ...comboboxApiRef.value.getOptionProps(option),
      // Selected options are defined by tags
      ["aria-selected"]: isSelected(option.label),
      ["data-checked"]: null,
    })

    return () => {
      const comboboxApi = comboboxApiRef.value
      const tagsApi = tagsApiRef.value

      return (
        <>
          <main class="combobox combobox-tags">
            <div>
              <div {...mergeProps(comboboxApi.rootProps, tagsApi.rootProps)}>
                <label {...comboboxApi.labelProps}>Select countries</label>

                <div {...comboboxApi.controlProps}>
                  <div>
                    {tagsApi.value.map((value, index) => (
                      <span key={`${toDashCase(value)}-tag-${index}`}>
                        <div data-testid={`${toDashCase(value)}-tag`} {...tagsApi.getTagProps({ index, value })}>
                          <span>{value}</span>
                          <button
                            data-testid={`${toDashCase(value)}-close-button`}
                            {...tagsApi.getTagDeleteTriggerProps({ index, value })}
                          >
                            &#x2715;
                          </button>
                        </div>
                        <input
                          data-testid={`${toDashCase(value)}-input`}
                          {...tagsApi.getTagInputProps({ index, value })}
                        />
                      </span>
                    ))}
                    <input {...inputProps.value} placeholder="Add tag..." />
                  </div>
                  <button {...comboboxApi.triggerProps}>▼</button>
                </div>
              </div>

              <div {...comboboxApi.positionerProps}>
                {options.value.length > 0 && (
                  <ul {...comboboxApi.contentProps}>
                    {options.value.map((item, index) => (
                      <li
                        key={`${item.code}:${index}`}
                        {...getOptionProps({
                          label: item.label,
                          value: item.code,
                          index,
                          disabled: item.disabled,
                        })}
                      >
                        {isSelected(item.label) && <span>✓</span>}
                        {item.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </main>

          <Toolbar controls={controls.ui}>
            <StateVisualizer state={comboboxState} />
            <StateVisualizer state={tagsState} />
          </Toolbar>
        </>
      )
    }
  },
})
