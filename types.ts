
export enum MedicalEntity {
  DISEASE = 'disease',
  SYMPTOM = 'symptom',
  TREATMENT = 'treatment',
  RISK_FACTOR = 'risk_factor',
  TEST_DIAGNOSTIC = 'test/diagnostic',
  GENE = 'gene',
  BIOMARKER = 'biomarker',
  COMPLICATION = 'complication',
  PROGNOSIS = 'prognosis',
  COMORBIDITY = 'comorbidity',
  PROGRESSION = 'progression',
  BODY_PART = 'body_part'
}

export enum CausalRelation {
  CAUSE = 'cause',
  TREAT = 'treat',
  PRESENT = 'present',
  DIAGNOSE = 'diagnose',
  AGGRAVATE = 'aggravate',
  PREVENT = 'prevent',
  IMPROVE = 'improve',
  AFFECT = 'affect'
}

export interface Triple {
  subject: string;
  subject_type: MedicalEntity;
  predicate: CausalRelation;
  object: string;
  object_type: MedicalEntity;
  source?: string;
}

export interface ExtractionResult {
  triples: Triple[];
}

export interface SynthesisResult {
  narrative: string;
}

export interface AssistantResponse {
  text: string;
  isHallucinationRisk: boolean;
}
