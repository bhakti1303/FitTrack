import { useId } from 'react';

/**
 * Reusable controlled input with label, inline validation error,
 * helper text and optional character counter.
 * Shows the error only after the field has been touched (blurred / submitted).
 */
function FormInput({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error = '',
  touched = false,
  helper = '',
  maxLength,
  className = '',
  ...rest
}) {
  const id = useId();
  const showError = touched && !!error;
  const describedBy = showError ? `${id}-err` : helper ? `${id}-help` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="form-label fw-semibold">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={`form-control ${showError ? 'is-invalid' : ''}`}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        maxLength={maxLength}
        aria-invalid={showError}
        aria-describedby={describedBy}
        {...rest}
      />
      <div className="d-flex justify-content-between gap-2 mt-1">
        <div style={{ minHeight: '1.1rem' }}>
          {showError ? (
            <small id={`${id}-err`} className="field-error" role="alert">
              <i className="bi bi-exclamation-circle me-1" aria-hidden="true"></i>
              {error}
            </small>
          ) : helper ? (
            <small id={`${id}-help`} className="text-muted">{helper}</small>
          ) : null}
        </div>
        {maxLength && (
          <small className="text-muted" aria-hidden="true">
            {value.length}/{maxLength}
          </small>
        )}
      </div>
    </div>
  );
}

export default FormInput;
