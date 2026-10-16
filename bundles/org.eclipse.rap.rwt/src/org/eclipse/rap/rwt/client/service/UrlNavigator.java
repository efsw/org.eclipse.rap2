/*******************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    EclipseSource - initial API and implementation
 ******************************************************************************/
package org.eclipse.rap.rwt.client.service;

/**
 * The UrlNavigator service sends the client to another address, leaving the application behind.
 * <p>
 * It is the counterpart of {@link UrlLauncher}, which opens the address somewhere else and leaves
 * the application where it is. Here the page the client is showing is replaced, so the session is
 * abandoned: anything that has to be said or saved must be done before the call.
 * </p>
 *
 * @noimplement This interface is not intended to be implemented by clients.
 */
public interface UrlNavigator extends ClientService {

  /**
   * Replaces the page the client is showing with the given URL.
   *
   * @param url the URL to go to
   */
  void navigateTo( String url );

}
