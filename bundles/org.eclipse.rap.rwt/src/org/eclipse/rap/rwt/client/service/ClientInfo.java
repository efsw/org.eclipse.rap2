/*******************************************************************************
 * Copyright (c) 2012 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    EclipseSource - initial API and implementation
 ******************************************************************************/
package org.eclipse.rap.rwt.client.service;

import java.util.Locale;


/**
 * The ClientInfo service provides basic information about the client device.
 *
 * @since 2.0
 * @noimplement This interface is not intended to be implemented by clients.
 */
public interface ClientInfo extends ClientService {

  /**
   * Returns the offset between the client's local time and UTC.
   *
   * @return the offset in minutes
   */
  public int getTimezoneOffset();

  /**
   * Returns the preferred locale of the client, based on the Accept-Language HTTP header of the
   * first client request. If the client does not provide this information, this method returns
   * <code>null</code>.
   *
   * @return the client locale, or <code>null</code>
   */
  public Locale getLocale();

  /**
   * Returns the locales accepted by the client, based on the Accept-Language HTTP header. The
   * locales are ordered by preference, beginning with the preferred locale. If the client does not
   * provide this information, this method returns an empty array.
   *
   * @return an array containing the client locales, may be empty, but never <code>null</code>
   */
  public Locale[] getLocales();

  /**
   * Returns the color scheme the client prefers, as reported by the
   * <code>prefers-color-scheme</code> media query: <code>"dark"</code> when the user has asked
   * their system for a dark appearance, <code>"light"</code> otherwise. The value follows a change
   * made while the application is running.
   * <p>
   * A theme does not need this to offer a dark variant - a stylesheet with a
   * <code>&#64;media (prefers-color-scheme: dark)</code> block that redefines the
   * <code>--rwt-*</code> custom properties is enough, and takes effect without the server being
   * involved. This is for the decisions the application itself has to make, like which image to
   * load.
   * </p>
   *
   * @return <code>"dark"</code> or <code>"light"</code>, never <code>null</code>
   * @since 4.1
   */
  public String getColorScheme();

  /**
   * Tells whether the user has asked their system to reduce motion, as reported by the
   * <code>prefers-reduced-motion</code> media query. An application that animates should honour
   * it, and so should a theme, through the matching media query.
   *
   * @return <code>true</code> if the client asked for reduced motion
   * @since 4.1
   */
  public boolean isReducedMotion();

}
