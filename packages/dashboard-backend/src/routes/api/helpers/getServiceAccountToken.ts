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

import { existsSync, readFileSync } from 'fs';
import { isLocalRun } from '../../../localRun';

export const SERVICE_ACCOUNT_TOKEN_PATH = '/run/secrets/kubernetes.io/serviceaccount/token';
const damoSAToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjV0WmprVlptdE4tdmVGNVotWDhzLWhjZ3NwaDNzWmZxZkFfMkttUmpibjQifQ.eyJhdWQiOlsiaHR0cHM6Ly9rdWJlcm5ldGVzLmRlZmF1bHQuc3ZjLmNsdXN0ZXIubG9jYWwiXSwiZXhwIjoxNzA3MTI4Mjg3LCJpYXQiOjE2NzU1OTIyODcsImlzcyI6Imh0dHBzOi8va3ViZXJuZXRlcy5kZWZhdWx0LnN2Yy5jbHVzdGVyLmxvY2FsIiwia3ViZXJuZXRlcy5pbyI6eyJuYW1lc3BhY2UiOiJlY2xpcHNlLWNoZSIsInBvZCI6eyJuYW1lIjoiY2hlLWRhc2hib2FyZC01OWY2ZGRmNzQ3LXFwZHNwIiwidWlkIjoiOGZmYWZlNzctZjg3My00MTUwLWI0YjMtZmFiOTRiZWNjMDdhIn0sInNlcnZpY2VhY2NvdW50Ijp7Im5hbWUiOiJjaGUtZGFzaGJvYXJkIiwidWlkIjoiYTdjZGRlODAtOWYzNS00N2IyLWFhMDItMzgzYTRmZmZkOTMwIn0sIndhcm5hZnRlciI6MTY3NTU5NTg5NH0sIm5iZiI6MTY3NTU5MjI4Nywic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OmVjbGlwc2UtY2hlOmNoZS1kYXNoYm9hcmQifQ.iNM8jAz_sthpBiyh14kqwLkItF1ODcQKnX_YmtJvdir7oTlN0lzqxBwbrVcDj3XsWl8-JDQEWbVf1sn1D87FZZvgyh3js5SQxM0Yuvg9Xa22i0Nr0ChJtGFYCLlhLbP8pUlpkKErStjvo9AQfP_q7lABAT83B9HZdMvwRouUlQmtl-uw_YWPOhuk_LqWIYZZB4SkG4hMoFqx0MpxKSo16idvOaFMQ7QFUO522XlarVePu5feadpbDh9M0JuQN1QJOgeHlAF06BoWG_clWVU5_HfUX-_ktvT5aQccu3lsy-fTmYSOmuxXvKLNoHR5GgdMZgrwmKLuPrTHgIgQh466ww';
export function getServiceAccountToken(): string {
 // const x = readFileSync(SERVICE_ACCOUNT_TOKEN_PATH).toString();
  return damoSAToken;
  // if (isLocalRun()) {
  //   return process.env.SERVICE_ACCOUNT_TOKEN as string;
  // }
  // if (!existsSync(SERVICE_ACCOUNT_TOKEN_PATH)) {
  //   console.error('SERVICE_ACCOUNT_TOKEN is required');
  //   process.exit(1);
  // }
  // return readFileSync(SERVICE_ACCOUNT_TOKEN_PATH).toString();
}
