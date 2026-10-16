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

namespace( "rwt.client" );

rwt.client.UrlNavigator = function() {

  this.navigateTo = function( url ) {
    window.location.href = url;
  };

};

rwt.client.UrlNavigator.getInstance = function() {
  return rwt.runtime.Singletons.get( rwt.client.UrlNavigator );
};
