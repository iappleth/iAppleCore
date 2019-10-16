/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.1  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License.
 * The Original Code is Openbravo ERP.
 * The Initial Developer of the Original Code is Openbravo SLU 
 * All portions are Copyright (C) 2019 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.scheduling;

import java.text.ParseException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Date;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

/**
 * Provides utility methods that help to deal with dates when scheduling a process.
 */
class SchedulerTimeUtils {

  private static final Logger log = LogManager.getLogger();
  private static final DateTimeFormatter DEFAULT_FORMATTER = DateTimeFormatter
      .ofPattern("dd-MM-yyyy HH:mm:ss");

  private SchedulerTimeUtils() {
  }

  /**
   * Utility method to parse a date with time String into a {@link Date}.
   * 
   * @param dateTime
   *          A date with time as a String. Expected format: 'dd-MM-yyyy HH:mm:ss'
   * 
   * @return a {@link Date} with the provided date and time.
   * 
   * @throws ParseException
   *           if the provided date and time can not be parsed to create the {@link Date} instance.
   */
  static Date timestamp(String dateTime) throws ParseException {
    LocalDateTime localDateTime = parse(dateTime);
    try {
      return Date.from(localDateTime.atZone(ZoneId.systemDefault()).toInstant());
    } catch (Exception ex) {
      log.error("Could not parse date {}", dateTime, ex);
      throw new ParseException("Could not parse date " + dateTime, -1);
    }
  }

  /**
   * Utility method to parse a date with time String into a {@link LocalDateTime}.
   * 
   * @param dateTime
   *          A date with time as a String. Expected format: 'dd-MM-yyyy HH:mm:ss'
   * 
   * @return a {@link LocalDateTime} with the provided date and time.
   * 
   * @throws ParseException
   *           if the provided date and time can not be parsed to create the {@link LocalDateTime}
   *           instance.
   */
  static LocalDateTime parse(String dateTime) throws ParseException {
    try {
      return LocalDateTime.parse(dateTime, DEFAULT_FORMATTER);
    } catch (DateTimeParseException ex) {
      log.error("Could not parse date {}", dateTime, ex);
      throw new ParseException("Could not parse date " + dateTime, -1);
    }
  }

  /**
   * Formats the current date using a specific format.
   * 
   * @param format
   *          the date time format to be applied.
   * 
   * @return a String with the current date time formatted with the provided format.
   * 
   */
  static String currentDate(String format) {
    return format(LocalDateTime.now(), format);
  }

  /**
   * Formats the provided date using a specific format.
   * 
   * @param format
   *          the date time format to be applied.
   * 
   * @return a String with the date formatted with the provided format.
   */
  static String format(Date date, String format) {
    LocalDateTime localDateTime = date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
    return format(localDateTime, format);
  }

  private static String format(LocalDateTime localDateTime, String format) {
    return localDateTime.format(DateTimeFormatter.ofPattern(format));
  }
}
