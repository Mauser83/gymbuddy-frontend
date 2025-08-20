import {gql} from '@apollo/client';

// Angles
export const LIST_ANGLES = gql`
  query Angles {
    angles {
      id
      name
      active
    }
  }
`;

export const CREATE_ANGLE = gql`
  mutation CreateAngle($name: String!) {
    createAngle(name: $name) {
      id
      name
      active
    }
  }
`;

export const UPDATE_ANGLE = gql`
  mutation UpdateAngle($id: Int!, $name: String!, $active: Boolean) {
    updateAngle(id: $id, name: $name, active: $active) {
      id
      name
      active
    }
  }
`;

// Heights
export const LIST_HEIGHTS = gql`
  query Heights {
    heights {
      id
      name
      active
    }
  }
`;

export const CREATE_HEIGHT = gql`
  mutation CreateHeight($name: String!) {
    createHeight(name: $name) {
      id
      name
      active
    }
  }
`;

export const UPDATE_HEIGHT = gql`
  mutation UpdateHeight($id: Int!, $name: String!, $active: Boolean) {
    updateHeight(id: $id, name: $name, active: $active) {
      id
      name
      active
    }
  }
`;

// Lighting
export const LIST_LIGHTING = gql`
  query Lighting {
    lighting {
      id
      name
      active
    }
  }
`;

export const CREATE_LIGHTING = gql`
  mutation CreateLighting($name: String!) {
    createLighting(name: $name) {
      id
      name
      active
    }
  }
`;

export const UPDATE_LIGHTING = gql`
  mutation UpdateLighting($id: Int!, $name: String!, $active: Boolean) {
    updateLighting(id: $id, name: $name, active: $active) {
      id
      name
      active
    }
  }
`;

// Mirrors
export const LIST_MIRRORS = gql`
  query Mirrors {
    mirrors {
      id
      name
      active
    }
  }
`;

export const CREATE_MIRROR = gql`
  mutation CreateMirror($name: String!) {
    createMirror(name: $name) {
      id
      name
      active
    }
  }
`;

export const UPDATE_MIRROR = gql`
  mutation UpdateMirror($id: Int!, $name: String!, $active: Boolean) {
    updateMirror(id: $id, name: $name, active: $active) {
      id
      name
      active
    }
  }
`;

// Distances
export const LIST_DISTANCES = gql`
  query Distances {
    distances {
      id
      name
      active
    }
  }
`;

export const CREATE_DISTANCE = gql`
  mutation CreateDistance($name: String!) {
    createDistance(name: $name) {
      id
      name
      active
    }
  }
`;

export const UPDATE_DISTANCE = gql`
  mutation UpdateDistance($id: Int!, $name: String!, $active: Boolean) {
    updateDistance(id: $id, name: $name, active: $active) {
      id
      name
      active
    }
  }
`;

// Sources
export const LIST_SOURCES = gql`
  query Sources {
    sources {
      id
      name
      active
    }
  }
`;

export const CREATE_SOURCE = gql`
  mutation CreateSource($name: String!) {
    createSource(name: $name) {
      id
      name
      active
    }
  }
`;

export const UPDATE_SOURCE = gql`
  mutation UpdateSource($id: Int!, $name: String!, $active: Boolean) {
    updateSource(id: $id, name: $name, active: $active) {
      id
      name
      active
    }
  }
`;

// Splits
export const LIST_SPLITS = gql`
  query Splits {
    splits {
      id
      name
      active
    }
  }
`;

export const CREATE_SPLIT = gql`
  mutation CreateSplit($name: String!) {
    createSplit(name: $name) {
      id
      name
      active
    }
  }
`;

export const UPDATE_SPLIT = gql`
  mutation UpdateSplit($id: Int!, $name: String!, $active: Boolean) {
    updateSplit(id: $id, name: $name, active: $active) {
      id
      name
      active
    }
  }
`;