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
package org.eclipse.rap.rwt.internal.client;

import org.eclipse.rap.json.JsonObject;
import org.eclipse.rap.rwt.RWT;
import org.eclipse.rap.rwt.client.service.SessionShutdown;
import org.eclipse.rap.rwt.internal.remote.ConnectionImpl;
import org.eclipse.rap.rwt.remote.RemoteObject;


public class SessionShutdownImpl implements SessionShutdown {

  private static final String TYPE = "rwt.client.SessionShutdown";
  private final RemoteObject remoteObject;

  public SessionShutdownImpl() {
    ConnectionImpl connection = ( ConnectionImpl )RWT.getUISession().getConnection();
    remoteObject = connection.createServiceObject( TYPE );
  }

  @Override
  public void requestShutdown() {
    remoteObject.call( "requestShutdown", new JsonObject() );
  }

}
