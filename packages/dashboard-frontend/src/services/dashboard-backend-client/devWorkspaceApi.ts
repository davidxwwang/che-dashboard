/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import axios from 'axios';
import { helpers, api } from '@eclipse-che/common';
import devfileApi, { IDevWorkspacesList } from '../devfileApi';
import { prefix } from './const';
import { JSONSchema7 } from 'json-schema';

export async function createWorkspace(
  devworkspace: devfileApi.DevWorkspace,
): Promise<devfileApi.DevWorkspace> {
  try {
    const response = await axios.post(
      `${prefix}/namespace/${devworkspace.metadata.namespace}/devworkspaces`,
      { devworkspace },
    );
    return response.data;
  } catch (e) {
    const errorMessage = helpers.errors.getMessage(e);
    if (errorMessage.startsWith('Unable to create devworkspace')) {
      throw errorMessage;
    }
    throw `Failed to create a new workspace. ${errorMessage}`;
  }
}

export async function listWorkspacesInNamespace(
  defaultNamespace: string,
): Promise<IDevWorkspacesList> {
  try {
    const response = await axios.get(`${prefix}/namespace/${defaultNamespace}/devworkspaces`);
    return response.data;
  } catch (e) {
    throw `Failed to fetch the list of devWorkspaces. ${helpers.errors.getMessage(e)}`;
  }
}

export async function getWorkspaceByName(
  namespace: string,
  workspaceName: string,
): Promise<devfileApi.DevWorkspace> {
  try {
    const response = await axios.get(
      `${prefix}/namespace/${namespace}/devworkspaces/${workspaceName}`,
    );
    return response.data;
  } catch (e) {
    throw `Failed to fetch workspace '${workspaceName}'. ${helpers.errors.getMessage(e)}`;
  }
}

export async function patchWorkspace(
  namespace: string,
  workspaceName: string,
  patch: api.IPatch[],
): Promise<devfileApi.DevWorkspace> {
  try {
    const response = await axios.patch(
      `${prefix}/namespace/${namespace}/devworkspaces/${workspaceName}`,
      patch,
    );
    return response.data;
  } catch (e) {
    throw `Failed to update workspace '${workspaceName}'. ${helpers.errors.getMessage(e)}`;
  }
}

export async function deleteWorkspace(namespace: string, workspaceName: string): Promise<void> {
  try {
    await axios.delete(`${prefix}/namespace/${namespace}/devworkspaces/${workspaceName}`);
  } catch (e) {
    throw `Failed to delete workspace '${workspaceName}'. ${helpers.errors.getMessage(e)}`;
  }
}

export async function shareWorkspace(
  namespace: string, 
  workspaceName: string, 
  beSharedUsers: Set<api.User>
): Promise<void> {
  try {
    const _beSharedUsers = Array.from(beSharedUsers).map((user)=> {
      return {beSharedUser: user.username}
    }) as api.IDevShare[]
    await axios.post(`${prefix}/namespace/${namespace}/devworkspaces/${workspaceName}/share`, _beSharedUsers);
  } catch (e) {
    throw `Failed to share workspace '${workspaceName}'. ${helpers.errors.getMessage(e)}`;
  }
}

export async function listShareWorkspaceCandidates(
  namespace: string, 
  workspaceName: string
): Promise<Array<api.User>> {
  try {
    const response = await axios.get(`${prefix}/devworkspaces/${workspaceName}/share/usercandidates`);
    return response.data
  } catch (e) {
    throw `Failed to share workspace '${workspaceName}'. ${helpers.errors.getMessage(e)}`;
  }
}

export async function getDockerConfig(namespace: string): Promise<api.IDockerConfig> {
  try {
    const response = await axios.get(`${prefix}/namespace/${namespace}/dockerconfig`);
    return response.data;
  } catch (e) {
    throw `Failed to fetch dockerconfig. ${helpers.errors.getMessage(e)}`;
  }
}

export async function putDockerConfig(
  namespace: string,
  dockerconfig: api.IDockerConfig,
): Promise<api.IDockerConfig> {
  try {
    const response = await axios.put(`${prefix}/namespace/${namespace}/dockerconfig`, dockerconfig);
    return response.data;
  } catch (e) {
    throw `Failed to put dockerconfig. ${helpers.errors.getMessage(e)}`;
  }
}

export async function injectKubeConfig(namespace: string, devworkspaceId: string): Promise<void> {
  try {
    await axios.post(
      `${prefix}/namespace/${namespace}/devworkspaceId/${devworkspaceId}/kubeconfig`,
    );
  } catch (e) {
    throw `Failed to inject kubeconfig. ${helpers.errors.getMessage(e)}`;
  }
}

export async function getDevfileSchema(
  schemaVersion: string,
): Promise<JSONSchema7 | { [key: string]: any }> {
  try {
    const response = await axios.get(`${prefix}/devfile?version=${schemaVersion}`);
    return response.data;
  } catch (e) {
    throw `Failed to get devfile schema '${schemaVersion}'. ${helpers.errors.getMessage(e)}`;
  }
}
