"use client";

import Modal from "@/components/common/Modal";
import ModalFormFields from "@/components/common/ModalFormFields";

import type { ComponentProps } from "react";

type FormModalProps = Omit<ComponentProps<typeof Modal>, "children"> & {
  fields: ComponentProps<typeof ModalFormFields>;
};

export default function FormModal({ fields, ...modalProps }: FormModalProps) {
  return (
    <Modal {...modalProps}>
      <ModalFormFields {...fields} />
    </Modal>
  );
}
