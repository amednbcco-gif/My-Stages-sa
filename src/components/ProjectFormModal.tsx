import { useState, useEffect } from "react";
import { Button, Input, Select } from "./ui";
import { Modal } from "./Modal";
import type { Project, ProjectStatus } from "../lib/types";
interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Project>) => Promise<void>;
  initial?: Project | null;
}
const STATUS_VALUES: ProjectStatus[] = ["New", "Pending", "In Progress", "Submitted", "Completed"];
export function ProjectFormModal({ open, onClose, onSave, initial }: ProjectFormModalProps) {
  const [projectName, setProjectName] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [planNo, setPlanNo] = useState("");
  const [poValueSAR, setPoValueSAR] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [sector, setSector] = useState("");
  const [projectType, setProjectType] = useState("");
  const [siteId, setSiteId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [projectManager, setProjectManager] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("Pending");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (initial) {
      setProjectName(initial.project_name);
      setPoNumber(initial.po_number);
      setPlanNo(initial.plan_no);
      setPoValueSAR(String(initial.po_value_sar || ""));
      setSiteId(initial.site_id);
      setRegion(initial.region ?? "");
      setCity(initial.city ?? "");
      setSector(initial.sector ?? "");
      setProjectType(initial.project_type ?? "");
      setLatitude(initial.latitude != null ? String(initial.latitude) : "");
      setLongitude(initial.longitude != null ? String(initial.longitude) : "");
      setProjectManager(initial.project_manager ?? "");
      setStatus(initial.status);
    } else {
      setProjectName("");
      setPoNumber("");
      setPlanNo("");
      setPoValueSAR("");
      setRegion("");
      setCity("");
      setSector("");
      setProjectType("");
      setSiteId("");
      setLatitude("");
      setLongitude("");
      setProjectManager("");
      setStatus("Pending");
    }
  }, [initial, open]);
  async function handleSave() {
    setSaving(true);
    await onSave({
      project_name: projectName,
      po_number: poNumber,
      plan_no: planNo,
      po_value_sar: Number(poValueSAR) || 0,
      site_id: siteId,
      region,
      city,
      sector,
      project_type: projectType,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      project_manager: projectManager,
      status,
    });
    setSaving(false);
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? `Edit ${initial.project_name || initial.sn}` : "Add Project"}
      maxWidth="max-w-4xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !projectName}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      {/* Basic info */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Project Name" value={projectName} onChange={setProjectName} placeholder="Project name" required />
        <Input label="Site ID" value={siteId} onChange={setSiteId} placeholder="Site ID" />
        <Input label="PO Number" value={poNumber} onChange={setPoNumber} placeholder="PO Number" />
        <Input label="Plan No" value={planNo} onChange={setPlanNo} placeholder="Plan No" />
        <Input label="PO Value SAR" value={poValueSAR} onChange={setPoValueSAR} type="number" placeholder="0" />
        <div className="text-xs text-gray-500 col-span-1 sm:col-span-2">
          PO Value SAR auto-populates DBOQ Amount and PO Amount fields automatically.
        </div>
        <Input label="Region" value={region} onChange={setRegion} placeholder="Region" />
        <Input label="City" value={city} onChange={setCity} placeholder="City" />
        <Input label="Owner" value={sector} onChange={setSector} placeholder="Owner" />
        <Input label="Project Type" value={projectType} onChange={setProjectType} placeholder="Project Type" />
        <Input label="Latitude" value={latitude} onChange={setLatitude} type="number" placeholder="e.g. 24.7136" />
        <Input label="Longitude" value={longitude} onChange={setLongitude} type="number" placeholder="e.g. 46.6753" />
        <Input label="Project Manager" value={projectManager} onChange={setProjectManager} placeholder="Project Manager" />
        <Select
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as ProjectStatus)}
          options={STATUS_VALUES.map((s) => ({ value: s, label: s }))}
        />
      </div>
    </Modal>
  );
}
