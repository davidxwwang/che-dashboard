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

import { FastifyInstance } from 'fastify';
import fastifyStatic from 'fastify-static';
import path from 'path';

export function registerStaticServer(publicFolder: string, server: FastifyInstance) {
  const rootPath = path.resolve(__dirname, publicFolder);
  console.log(`Static server's serving "${rootPath}" on 0.0.0.0:8080/dashboard/`);

  server.register(fastifyStatic, {
    root: rootPath,
    maxAge: 24 * 60 * 60 * 1000,
    lastModified: true,
    prefix: '/dashboard/',
  });
  server.get('/', async (request, reply) => {
    reply.code(204);
    return reply.send();
  });

  server.get('/dashboard', async (request, reply) => {
    return reply.redirect('/dashboard/');
  });

  const doNotCache = [
    '/dashboard/',
    '/dashboard/index.html',
    '/dashboard/assets/branding/product.json',
  ];
  server.addHook('onSend', (request, reply, payload: any, done) => {
    const err = null;
    if (doNotCache.includes(request.url)) {
      reply.header('cache-control', 'no-store, max-age=0');
    }
    done(err, payload);
  })
}
