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

/**
 * 数组去重
 * @param originalArray 
 * @param groupBy 
 * @returns 
 */
export function removeDuplicateElement<E, U>(originalArray: Array<E>, groupBy: (item: E) => U): Array<E>{
    const map = new Map<U, E>();
    originalArray.forEach((item) => {
        const key = groupBy(item);
        if(!map.has(key)){
            map.set(key, item)
        }
    })
    return [...map.values()]

}