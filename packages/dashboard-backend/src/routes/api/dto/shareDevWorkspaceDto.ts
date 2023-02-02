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

import 'reflect-metadata';
import { jsonMember, jsonObject, IJsonMemberOptions, jsonArrayMember } from "typedjson";

@jsonObject
class BesharedInfo{
    /**
     * 被分享devws的人
     */
    @jsonMember
    public sharedToUserName: string;

    constructor(sharedToUserName: string){
        this.sharedToUserName = sharedToUserName;
    }
}

@jsonObject
class ShareDevWorkspaceInfo{

    /**
     * 分享人
     */
    @jsonMember
    public sharer: string;

    /**
     * 分享的DevWs
     */
    @jsonMember
    public devWorkspace: string;

    /**
     * 分享DevWs所在的namespace
     */
    @jsonMember
    public namespace: string;

    @jsonArrayMember(BesharedInfo)
    public shared: Array<BesharedInfo>;
    
    constructor(sharer: string, devWorkspace: string, namespace: string, shared: Array<BesharedInfo>){
        this.sharer = sharer;
        this.devWorkspace = devWorkspace;
        this.namespace = namespace;
        this.shared = shared;
    }
}

export {ShareDevWorkspaceInfo, BesharedInfo}