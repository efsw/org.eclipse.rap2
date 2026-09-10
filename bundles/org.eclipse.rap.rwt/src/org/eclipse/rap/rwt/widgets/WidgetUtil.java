/*******************************************************************************
 * Copyright (c) 2002, 2014 Innoopract Informationssysteme GmbH and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    Innoopract Informationssysteme GmbH - initial API and implementation
 *    EclipseSource - ongoing development
 ******************************************************************************/
package org.eclipse.rap.rwt.widgets;

import java.util.Map;

import org.eclipse.rap.rwt.internal.lifecycle.WidgetLCAUtil;
import org.eclipse.swt.widgets.Widget;


/**
 * Helper class to access RWT specific properties of widgets.
 *
 * @since 2.3
 */
public final class WidgetUtil {

  private WidgetUtil() {
    // prevent instantiation
  }

  /**
   * Returns the protocol ID of the given widget.
   *
   * @param widget the widget to obtain the id for, must not be <code>null</code>
   * @return the id for the given <code>widget</code>
   */
  public static String getId( Widget widget ) {
    return org.eclipse.rap.rwt.internal.lifecycle.WidgetUtil.getId( widget );
  }

  /**
   * Adds keys to the list of widget data keys to be synchronized with the client. It is save to add
   * the same key twice, there are no side-effects. The method has to be called from the UI thread
   * and affects the entire UI-session. The data is only transferred from server to client, not
   * back.
   *
   * @see org.eclipse.swt.widgets.Widget#setData(String, Object)
   * @param keys The keys to add to the list.
   */
  public static void registerDataKeys( String... keys ) {
    org.eclipse.rap.rwt.internal.lifecycle.WidgetUtil.registerDataKeys( keys );
  }

  /**
   * Sets an HTML attribute on the element that represents the given widget in the browser. This is
   * the way to attach ARIA attributes and roles, <code>data-*</code> attributes, or additional css
   * classes to a widget:
   *
   * <pre>
   * WidgetUtil.setHtmlAttribute( button, "aria-label", "Save the document" );
   * WidgetUtil.setHtmlAttribute( table, "data-testid", "order-list" );
   * WidgetUtil.setHtmlAttribute( composite, "class", "card card--elevated" );
   * </pre>
   *
   * The <code>class</code> attribute is a special case: its value is appended to the css classes
   * that RWT generates for the widget - the type of the widget, its appearance, and one class per
   * widget state - instead of replacing them.
   * <p>
   * Attributes are rendered on the outer element of the widget. They are not validated: it is up
   * to the caller to use attribute names and values that are valid HTML, and to use ARIA
   * attributes that are consistent with the role of the widget.
   * </p>
   * <p>
   * Supported for every <code>Control</code> and for the items of Table, Tree, TabFolder,
   * CTabFolder, ToolBar, CoolBar, Menu and ExpandBar, as well as for table and tree columns.
   * Attributes set on a widget of another type are silently ignored by the client.
   * </p>
   *
   * @param widget the widget to set the attribute on, must not be <code>null</code>
   * @param name the name of the attribute, must not be <code>null</code>
   * @param value the value of the attribute, or <code>null</code> to remove it
   * @since 4.1
   */
  public static void setHtmlAttribute( Widget widget, String name, String value ) {
    checkNotNull( widget, "widget" );
    checkNotNull( name, "name" );
    WidgetLCAUtil.setHtmlAttribute( widget, name, value );
  }

  /**
   * Returns the HTML attributes that were set for the given widget with
   * {@link #setHtmlAttribute(Widget, String, String)}, as an unmodifiable map. The map is empty if
   * no attribute was set.
   *
   * @param widget the widget to read the attributes of, must not be <code>null</code>
   * @return the attributes of the widget, never <code>null</code>
   * @since 4.1
   */
  public static Map<String, String> getHtmlAttributes( Widget widget ) {
    checkNotNull( widget, "widget" );
    return WidgetLCAUtil.getHtmlAttributes( widget );
  }

  private static void checkNotNull( Object value, String name ) {
    if( value == null ) {
      throw new NullPointerException( name + " must not be null" );
    }
  }

}
