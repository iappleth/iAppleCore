package org.apache.ddlutils.model;

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import java.math.BigDecimal;
import java.sql.Time;
import java.sql.Timestamp;
import java.sql.Types;
import java.sql.Date;
import org.apache.commons.beanutils.ConvertUtils;
import org.apache.commons.lang.builder.EqualsBuilder;
import org.apache.commons.lang.builder.HashCodeBuilder;
import org.apache.ddlutils.util.Jdbc3Utils;

/**
 *
 * @author adrianromero
 * Created on 16 de julio de 2007, 12:31
 *
 */
public class Parameter extends ValueObject implements Cloneable {
    
    public final static int MODE_NONE = 0;
    public final static int MODE_IN = 1;
    public final static int MODE_OUT = 2;
    
    /** The name of the view, may be <code>null</code>. */
    private String _name;
    /** The parameter mode. */
    private int _modeCode;
    
    /** Creates a new instance of Parameter */
    public Parameter() {
        _name = null;
        _modeCode = MODE_NONE;
    }
    
    /**
     * Returns the name of this constraint check.
     * 
     * @return The name
     */
    public String getName() {
        return _name;
    }

    /**
     * Sets the name of this constraint check.
     * 
     * @param name The name
     */
    public void setName(String name) {
        _name = name;
    }    
    
    /**
     * Returns the mode of this parameter.
     * 
     * @return The mode
     */
    public int getModeCode() {
        return _modeCode;
    }

    /**
     * Sets the mode of this parameter.
     * 
     * @param mode The mode
     */
    public void setModeCode(int modeCode) {
        _modeCode = modeCode;
    }
    
    /**
     * Returns the mode of this parameter.
     * 
     * @return The mode
     */
    public String getMode() {
        
        switch (_modeCode) {
        case MODE_IN:
            return "in";
        case MODE_OUT:
            return "out";
        case MODE_NONE:
        default: 
            return "";     
        }
    }

    /**
     * Sets the mode of this parameter.
     * 
     * @param mode The mode
     */
    public void setMode(String mode) {
        if ("in".equals(mode)) {
            _modeCode = MODE_IN;
        } else if ("out".equals(mode)) {
            _modeCode = MODE_OUT;
        } else {
            _modeCode = MODE_NONE;
        }
    }
           
    /**
     * {@inheritDoc}
     */
    public Object clone() throws CloneNotSupportedException {
        Parameter result = (Parameter)super.clone();

        result._name = _name;
        result._modeCode = _modeCode;

        return result;
    }
    
    /**
     * {@inheritDoc}
     */
    public boolean equals(Object obj) {
        if (obj instanceof Parameter) {
            Parameter other = (Parameter)obj;
            return new EqualsBuilder()
                .append(_name, other._name)
                .append(_typeCode, other._typeCode)
                .append(_modeCode, other._modeCode)
                .append(_defaultValue, other._defaultValue)
                .isEquals();
        } else {
            return false;
        }
    }    
    
    /**
     * {@inheritDoc}
     */
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
            .append(_name)
            .append(_typeCode)
            .append(_modeCode)
            .append(_defaultValue)
            .toHashCode();
    }   
    
    /**
     * {@inheritDoc}
     */
    public String toString() {
        StringBuffer result = new StringBuffer();

        result.append("Parameter [name=");
        result.append(getName());
        result.append("; type=");
        result.append(getType());
        result.append("; mode=");
        result.append(getMode());
        result.append("; defaultValue=");
        result.append(getDefaultValue());
        result.append("]");

        return result.toString();
    }    
}
