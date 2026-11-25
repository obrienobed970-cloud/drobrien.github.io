"use client";

import { useActionState, startTransition, type FormEvent } from "react";
import type { FormState } from "./actions";

/**
 * Like useActionState, but submits via onSubmit so React doesn't clear the
 * form automatically: fields are kept when the server returns an error.
 */
export function useFormAction(fn: (prev: FormState, form: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState<FormState, FormData>(fn, {});
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  };
  return [state, onSubmit, pending] as const;
}
