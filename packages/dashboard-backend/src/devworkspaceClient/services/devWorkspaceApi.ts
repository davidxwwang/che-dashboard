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

import * as k8s from '@kubernetes/client-node';
import { IDevWorkspaceList, IDevWorkspaceApi, IDevWorkspaceCallbacks, IDevWorkspaceShare, IDevWorkspaceShareList } from '../types';
import {
  devworkspaceGroup,
  devworkspaceLatestVersion,
  devworkspacePlural,
  V1alpha2DevWorkspace,
} from '@devfile/api';

import { api } from '@eclipse-che/common';
import { createError } from './helpers/createError';
import { isLocalRun } from '../../localRun';
import { CustomObjectAPI, prepareCustomObjectAPI } from './helpers/prepareCustomObjectAPI';
import { prepareCustomObjectWatch } from './helpers/prepareCustomObjectWatch';
import { ShareDevWorkspaceInfo } from '../../routes/api/dto/shareDevWorkspaceDto';
import { shareDevWorkspaceInfoFullVersion, shareDevWorkspaceInfoGroup, shareDevWorkspaceInfoKind, shareDevWorkspaceInfoPlural, shareDevWorkspaceInfoVersion, userGroup, userPlural, userStoreNamespace, userVersion } from '../../constants/share-devworkspace-config';
import { getDevWorkspaceClient } from '../../routes/api/helpers/getDevWorkspaceClient';
import { getUserName } from '../../helpers/getUserName';

const DEV_WORKSPACE_API_ERROR_LABEL = 'CUSTOM_OBJECTS_API_ERROR';

export class DevWorkspaceApiService implements IDevWorkspaceApi {
  private readonly customObjectAPI: CustomObjectAPI;
  private readonly customObjectWatch: k8s.Watch;

  constructor(kc: k8s.KubeConfig) {
    this.customObjectAPI = prepareCustomObjectAPI(kc);
    this.customObjectWatch = prepareCustomObjectWatch(kc);
  }

  async listSharedDevWorkspaces(): Promise<Array<V1alpha2DevWorkspace>> {
    const clusterAccessToken = process.env.CLUSTER_ACCESS_TOKEN as string;
    const loginUserName = getUserName(clusterAccessToken)
    const shareDevWsList = await this.listShareDevWorkspaceInfo()
    const beSharedDevWs = new Array<V1alpha2DevWorkspace>();
    for(const eachShareItem of shareDevWsList){
      const beSharedUsers = eachShareItem.shareDevWorkspaceInfo.shared;
      const beSharedItem =  beSharedUsers.find((eachBeSharedUser) => {return eachBeSharedUser.sharedToUserName === loginUserName;});
      const isLoginUserBeShared = beSharedItem != undefined
      if(isLoginUserBeShared){
        // 此时说明有分享给他的了
        const shareDevWsUser = eachShareItem.shareDevWorkspaceInfo.sharer;
        const shareDevWorkspaceName = eachShareItem.shareDevWorkspaceInfo.devWorkspace;
        const shareDevWsNameSpace = eachShareItem.shareDevWorkspaceInfo.namespace;

        // todo 有可能此时devworkspace被删除了
        const devWorkspace = await this.getByName(shareDevWsNameSpace, shareDevWorkspaceName)
        beSharedDevWs.push(devWorkspace)
      }
    }
    return beSharedDevWs;
  }

  async share(shareDevWorkspaceInfo: ShareDevWorkspaceInfo): Promise<void> {
    
    try {
      // 1 create or update shareDevWorkspaceInfoConfig
      this.upsertShareDevWorkSpaceInfo(shareDevWorkspaceInfo);
      // 2 update rolebinding in user namespaace
      this.updataRoleBinding(shareDevWorkspaceInfo)

    } catch (e) {
      throw createError(
        e,
        DEV_WORKSPACE_API_ERROR_LABEL,
        ``,
      );
    }
  }

  async listInNamespace(namespace: string): Promise<IDevWorkspaceList> {
    try {
      const resp = await this.customObjectAPI.listNamespacedCustomObject(
        devworkspaceGroup,
        devworkspaceLatestVersion,
        namespace,
        devworkspacePlural,
      );
      return resp.body as IDevWorkspaceList;
    } catch (e) {
      throw createError(e, DEV_WORKSPACE_API_ERROR_LABEL, 'Unable to list devworkspaces');
    }
  }

  async getByName(namespace: string, name: string): Promise<V1alpha2DevWorkspace> {
    try {
      const resp = await this.customObjectAPI.getNamespacedCustomObject(
        devworkspaceGroup,
        devworkspaceLatestVersion,
        namespace,
        devworkspacePlural,
        name,
      );
      return resp.body as V1alpha2DevWorkspace;
    } catch (e) {
      throw createError(
        e,
        DEV_WORKSPACE_API_ERROR_LABEL,
        `Unable to get devworkspace ${namespace}/${name}`,
      );
    }
  }

  async create(
    devworkspace: V1alpha2DevWorkspace,
    namespace: string,
  ): Promise<V1alpha2DevWorkspace> {
    try {
      if (!devworkspace.metadata?.name && !devworkspace.metadata?.generateName) {
        throw new Error(
          'Either DevWorkspace `metadata.name` or `metadata.generateName` is required.',
        );
      }

      const resp = await this.customObjectAPI.createNamespacedCustomObject(
        devworkspaceGroup,
        devworkspaceLatestVersion,
        namespace,
        devworkspacePlural,
        devworkspace,
      );
      return resp.body as V1alpha2DevWorkspace;
    } catch (e) {
      throw createError(e, DEV_WORKSPACE_API_ERROR_LABEL, 'Unable to create devworkspace');
    }
  }

  async update(devworkspace: V1alpha2DevWorkspace): Promise<V1alpha2DevWorkspace> {
    try {
      if (!devworkspace.metadata?.name || !devworkspace.metadata?.namespace) {
        throw new Error('DevWorkspace.metadata with name and namespace are required');
      }

      // you have to delete some elements from the devworkspace in order to update
      if (devworkspace.metadata?.uid) {
        devworkspace.metadata.uid = undefined;
      }
      if (devworkspace.metadata?.creationTimestamp) {
        delete devworkspace.metadata.creationTimestamp;
      }
      if (devworkspace.metadata?.deletionTimestamp) {
        delete devworkspace.metadata.deletionTimestamp;
      }

      const name = devworkspace.metadata.name;
      const namespace = devworkspace.metadata.namespace;

      const resp = await this.customObjectAPI.replaceNamespacedCustomObject(
        devworkspaceGroup,
        devworkspaceLatestVersion,
        namespace,
        devworkspacePlural,
        name,
        devworkspace,
      );
      return resp.body as V1alpha2DevWorkspace;
    } catch (e) {
      throw createError(e, DEV_WORKSPACE_API_ERROR_LABEL, 'Unable to update devworkspace');
    }
  }

  async delete(namespace: string, name: string): Promise<void> {
    try {
      await this.customObjectAPI.deleteNamespacedCustomObject(
        devworkspaceGroup,
        devworkspaceLatestVersion,
        namespace,
        devworkspacePlural,
        name,
      );
    } catch (e) {
      throw createError(
        e,
        DEV_WORKSPACE_API_ERROR_LABEL,
        `Unable to delete devworkspace ${namespace}/${name}`,
      );
    }
  }

  /**
   * Patch a DevWorkspace
   */
  async patch(
    namespace: string,
    name: string,
    patches: api.IPatch[],
  ): Promise<V1alpha2DevWorkspace> {
    return this.createPatch(namespace, name, patches);
  }

  private async createPatch(namespace: string, name: string, patches: api.IPatch[]) {
    try {
      const options = {
        headers: {
          'Content-type': k8s.PatchUtils.PATCH_FORMAT_JSON_PATCH,
        },
      };
      const resp = await this.customObjectAPI.patchNamespacedCustomObject(
        devworkspaceGroup,
        devworkspaceLatestVersion,
        namespace,
        devworkspacePlural,
        name,
        patches,
        undefined,
        undefined,
        undefined,
        options,
      );
      return resp.body as V1alpha2DevWorkspace;
    } catch (e) {
      throw createError(e, DEV_WORKSPACE_API_ERROR_LABEL, 'Unable to patch devworkspace');
    }
  }

  async watchInNamespace(
    namespace: string,
    resourceVersion: string,
    callbacks: IDevWorkspaceCallbacks,
  ): Promise<{ abort: () => void }> {
    const path = `/apis/${devworkspaceGroup}/${devworkspaceLatestVersion}/watch/namespaces/${namespace}/${devworkspacePlural}`;
    const queryParams = { watch: true, resourceVersion };

    return this.customObjectWatch.watch(
      path,
      queryParams,
      (type: string, devworkspace: V1alpha2DevWorkspace) => {
        if (type === 'ADDED') {
          callbacks.onAdded(devworkspace);
        } else if (type === 'MODIFIED') {
          callbacks.onModified(devworkspace);
        } else if (type === 'DELETED') {
          const workspaceId = devworkspace?.status?.devworkspaceId;
          if (workspaceId) {
            callbacks.onDeleted(workspaceId);
          } else {
            // workspace does not have id yet, means it's not processed by DWO yet
          }
        } else if (type === 'ERROR') {
          callbacks.onError('Error: Unknown error.');
        } else {
          callbacks.onError(`Error: Unknown type '${type}'.`);
        }
      },
      (error: any) => {
        let message;
        if (error && error.message) {
          message = error.message;
        } else {
          if (isLocalRun()) {
            // unexpected error format. Log it and expose to user what we can
            console.log('Unexpected error', error);
          }
          if (error) {
            message = error.toString();
          }
          if (!message) {
            message = 'unknown. Contact admin to check server logs';
          }
        }
        callbacks.onError(`Error: ${message}`);
      },
    );
  }

  async listShareDevWorkspaceInfo() {

    const xx = await this.customObjectAPI.listNamespacedCustomObject(
      userGroup,
      userVersion,
      userStoreNamespace,
      userPlural,
    )
    const listResp = await this.customObjectAPI.listClusterCustomObject(
      shareDevWorkspaceInfoGroup,
      shareDevWorkspaceInfoVersion,
      shareDevWorkspaceInfoPlural,
    );
    return (listResp.body as IDevWorkspaceShareList).items;  
  }

   /**
   * save the devWorkSpace share info：who share which devWorkspace to who（is a clusterd cr）
   * @param shareDevWorkspaceInfo 
   */
   async upsertShareDevWorkSpaceInfo(shareDevWorkspaceInfo: ShareDevWorkspaceInfo){
    const listResp = await this.listShareDevWorkspaceInfo()
    const loginUserShareInfo = this.getloginUserShareDevWsInfo(listResp, shareDevWorkspaceInfo);
    const shareDevWorkspaceDto = this.constructShareDevWorkspace(shareDevWorkspaceInfo, loginUserShareInfo)
    const userNotShareAny = loginUserShareInfo == undefined
    if(userNotShareAny){
      await this.customObjectAPI.createClusterCustomObject(
        shareDevWorkspaceInfoGroup,
        shareDevWorkspaceInfoVersion,
        shareDevWorkspaceInfoPlural,
        shareDevWorkspaceDto,
      );
    }else{
      if(loginUserShareInfo.metadata?.name){
        const y = await this.customObjectAPI.replaceClusterCustomObject(
          shareDevWorkspaceInfoGroup,
          shareDevWorkspaceInfoVersion,
          shareDevWorkspaceInfoPlural,
          loginUserShareInfo.metadata?.name,
          shareDevWorkspaceDto
        );
        console.log('%c [ await ]-73', 'font-size:13px; background:pink; color:#bf2c9f;', y)
      }        
    }
  }

  /**
   * should update rolebinding in the sharer namespace then other people can see the shared DevWorkspace
   * @param shareDevWorkspaceInfo 
   */
  async updataRoleBinding(shareDevWorkspaceInfo: ShareDevWorkspaceInfo){
    if(shareDevWorkspaceInfo.shared){
      const clusterAccessToken = process.env.CLUSTER_ACCESS_TOKEN as string;
      const { rbacAuthorizationApi } = getDevWorkspaceClient(clusterAccessToken);
      rbacAuthorizationApi.updateRoleBindingByName(shareDevWorkspaceInfo)
    }
  } 

  /**
   * 用户和namespace是一对一关系
   * @param devShareList 
   * @param shareDevWorkspaceInfo 
   * @returns 如果是undefine就说明此用户没有分享过workspace
   */
  getloginUserShareDevWsInfo(devShareList: IDevWorkspaceShare[], shareDevWorkspaceInfo: ShareDevWorkspaceInfo): IDevWorkspaceShare | undefined{
    const loginUserShareInfo = devShareList.filter((item) => {return shareDevWorkspaceInfo.sharer === item.shareDevWorkspaceInfo.sharer});
    return loginUserShareInfo.length > 0 ? loginUserShareInfo[0] : undefined;
  }

  constructShareDevWorkspace(shareDevWorkspaceInfo: ShareDevWorkspaceInfo, currentShareInfo: IDevWorkspaceShare | undefined): IDevWorkspaceShare{
    const shareName = shareDevWorkspaceInfo.sharer + '-share';
    const isCreateShare = currentShareInfo === undefined;
    const shareDevMetadata = isCreateShare ? { name: shareName } : { name: shareName, resourceVersion: currentShareInfo.metadata.resourceVersion }
    const shareDevWorkspace = { apiVersion: shareDevWorkspaceInfoFullVersion, 
                                metadata: shareDevMetadata, 
                                kind: shareDevWorkspaceInfoKind, 
                                shareDevWorkspaceInfo
                              } as IDevWorkspaceShare;
    return shareDevWorkspace;
  }
}
