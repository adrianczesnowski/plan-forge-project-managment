export interface SearchTaskResult {
  id: string;
  title: string;
  wbsNumber: string;
  projectId: string;
  projectName: string;
}

export interface SearchProjectResult {
  id: string;
  name: string;
  spaceName: string;
}

export interface SearchSpaceResult {
  id: string;
  name: string;
  color: string | null;
}

export interface SearchResults {
  tasks: SearchTaskResult[];
  projects: SearchProjectResult[];
  spaces: SearchSpaceResult[];
}
