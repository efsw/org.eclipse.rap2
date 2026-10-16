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
 * The SessionShutdown service asks the client to end the session, as it does when its tab is
 * closed.
 * <p>
 * The session is not destroyed where the call is made: the client is asked to send the shutdown
 * request, and the server destroys the session while handling that request. This is what makes the
 * service usable from inside a request of its own - ending the session there would leave the
 * framework working on something that no longer exists.
 * </p>
 *
 * @noimplement This interface is not intended to be implemented by clients.
 */
public interface SessionShutdown extends ClientService {

  /**
   * Asks the client to send the shutdown request as soon as it is done with the current response.
   */
  void requestShutdown();

}
