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
import { V1RoleBinding, V1Subject } from '@kubernetes/client-node';
import { cheworkspacesRolebinding, cheAndDevworkspacesRolebinding } from '../../constants/share-devworkspace-config';
import { ShareDevWorkspaceInfo } from '../../routes/api/dto/shareDevWorkspaceDto';
import { getUserName } from '../../helpers/getUserName';
import { IRBACAuthApi } from "../types";
import { removeDuplicateElement } from '../../helpers/array';

export class RbacAuthorizationService implements IRBACAuthApi{

    private readonly rbacAuthorizationV1Api: k8s.RbacAuthorizationV1Api;

    constructor(kc: k8s.KubeConfig) {
      this.rbacAuthorizationV1Api = kc.makeApiClient(k8s.RbacAuthorizationV1Api);
    }

    async getRoleBindingByName(roleBindName: string, namespace: string): Promise<V1RoleBinding> {
        
        const namespacedRoleBinding = await this.rbacAuthorizationV1Api.readNamespacedRoleBinding(roleBindName, namespace);
        console.log('getRoleBindingByName = ' + JSON.stringify(namespacedRoleBinding.body));
        return namespacedRoleBinding.body;  
    }

    async updateRoleBindingByName(shareDevWorkspaceInfo : ShareDevWorkspaceInfo): Promise<any> {      
        this.updateCheworkspacesRolebinding(cheworkspacesRolebinding, shareDevWorkspaceInfo);
        this.updateCheworkspacesRolebinding(cheAndDevworkspacesRolebinding, shareDevWorkspaceInfo); 
    } 

    async updateCheworkspacesRolebinding(configMapName: string, updateObj : ShareDevWorkspaceInfo): Promise<any>{
        const rolebindingInfo = await this.getRoleBindingByName(configMapName, updateObj.namespace);
        
        const addUserSubjects = updateObj.shared.map(item => {
            return {"apiGroup":"rbac.authorization.k8s.io", "kind":"User", "name":item.sharedToUserName, "namespace":updateObj.namespace} as V1Subject;
        });
        const newSubjects = rolebindingInfo.subjects ? addUserSubjects.concat(rolebindingInfo.subjects) : addUserSubjects
        // 按名字去重
        const removeDuplicateNewSubjects = removeDuplicateElement(newSubjects, (item: V1Subject) => item.name)
    
        const patchData = {"metadata": rolebindingInfo.metadata, "roleRef": rolebindingInfo.roleRef, "subjects": removeDuplicateNewSubjects} as V1RoleBinding;
        const patchRoleBinding = await this.rbacAuthorizationV1Api.replaceNamespacedRoleBinding(configMapName, updateObj.namespace, patchData);
        console.log('david! replaceNamespacedRoleBinding = ' +  JSON.stringify(patchRoleBinding.response));
        return patchRoleBinding.response;
    }
}
