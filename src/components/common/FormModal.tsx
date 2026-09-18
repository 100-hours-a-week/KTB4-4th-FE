"use client";

import Modal from "@/components/common/Modal";
import ModalFormFields from "@/components/common/ModalFormFields";

import type { ComponentProps, ReactNode } from "react";

type FormModalProps = Omit<ComponentProps<typeof Modal>, "children"> & {
  fields: ComponentProps<typeof ModalFormFields>;
  beforeFields?: ReactNode;
};

export default function FormModal({ fields, beforeFields, ...modalProps }: FormModalProps) {
  return (
    <Modal {...modalProps}>
      {beforeFields}
      <ModalFormFields {...fields} />
    </Modal>
  );
}
