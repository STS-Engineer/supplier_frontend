// SupplierManagement.jsx
import React, { useState, useEffect } from 'react';
import { toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import './SupplierManagement.css';

const SupplierManagement = () => {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isCompleteCustomerModalOpen, setIsCompleteCustomerModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        supplier_name: '',
        description: ''
    });
    const [completeCustomerData, setCompleteCustomerData] = useState({
        group: {
            supplier_name: '',
            description: ''
        },
        units: []
    });
    const [formErrors, setFormErrors] = useState({});
    const [editingCustomer, setEditingCustomer] = useState(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredCustomers(customers);
        } else {
            const filtered = customers.filter((c) =>
                c.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredCustomers(filtered);
        }
    }, [searchTerm, customers]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const response = await fetch('https://supplier-back.azurewebsites.net/ajouter/api/groups');
            if (!response.ok) throw new Error('Failed to fetch customers');
            const data = await response.json();

            // For each customer, fetch certificates for their units
            const customersWithCertificates = await Promise.all(
                data.map(async (customer) => {
                    // Fetch certificates for each unit in parallel
                    const unitsWithCertificates = await Promise.all(
                        customer.units.map(async (unit) => {
                            try {
                                const certResponse = await fetch(`https://supplier-back.azurewebsites.net/ajouter/api/certificates/by-unit/${unit.unit_id}`);
                                if (certResponse.ok) {
                                    const certificates = await certResponse.json();
                                    return {
                                        ...unit,
                                        certificates
                                    };
                                }
                                return unit;
                            } catch (error) {
                                console.error(`Error fetching certificates for unit ${unit.unit_id}:`, error);
                                return unit;
                            }
                        })
                    );

                    return {
                        ...customer,
                        units: unitsWithCertificates
                    };
                })
            );

            setCustomers(customersWithCertificates);
            setFilteredCustomers(customersWithCertificates);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnitDetails = async (unitId) => {
        try {
            const response = await fetch(`https://supplier-back.azurewebsites.net/ajouter/api/units/${unitId}`);
            if (!response.ok) throw new Error('Failed to fetch unit details');
            const unitData = await response.json();

            // Fetch certificates for this unit
            const certResponse = await fetch(`https://supplier-back.azurewebsites.net/ajouter/api/certificates/by-unit/${unitId}`);
            if (certResponse.ok) {
                const certificates = await certResponse.json();
                unitData.certificates = certificates;
            }

            setSelectedUnit(unitData);
            setIsUnitModalOpen(true);
        } catch (err) {
            setError(err.message);
        }
    };

    // Debug: Log when modal opens with data
    useEffect(() => {
        if (isCompleteCustomerModalOpen && editingCustomer) {
            console.log('🔍 Modal opened with certificates:');
            completeCustomerData.units.forEach((unit, idx) => {
                console.log(`Unit ${idx + 1}: ${unit.unit_name} - ${unit.certificates?.length || 0} certs`, unit.certificates);
            });
        }
    }, [isCompleteCustomerModalOpen, completeCustomerData, editingCustomer]);
    // Add these functions after handleResponsibleChange:
    const handleCertificateChange = (unitIndex, certIndex, field, value) => {
        console.log('Certificate change:', unitIndex, certIndex, field, value);

        setCompleteCustomerData(prev => {
            const updated = JSON.parse(JSON.stringify(prev)); // Deep clone

            // Ensure the unit and certificates array exist
            if (!updated.units[unitIndex]) return prev;

            if (!updated.units[unitIndex].certificates) {
                updated.units[unitIndex].certificates = [];
            }

            // Ensure the certificate exists at the specified index
            if (!updated.units[unitIndex].certificates[certIndex]) {
                updated.units[unitIndex].certificates[certIndex] = {
                    Type: '',
                    validity_date: '',
                    certificat_id: null,
                    custom_type: ''
                };
            }

            // Update the specific field
            updated.units[unitIndex].certificates[certIndex][field] = value;

            return updated;
        });
    };

    const addCertificate = (unitIndex) => {
        console.log('addCertificate called for unit:', unitIndex);

        setCompleteCustomerData(prev => {
            const updated = JSON.parse(JSON.stringify(prev)); // Deep clone

            if (!updated.units[unitIndex]) {
                console.error('Unit not found at index:', unitIndex);
                return prev;
            }

            // Initialize certificates array if it doesn't exist
            if (!updated.units[unitIndex].certificates) {
                updated.units[unitIndex].certificates = [];
            }

            // Add new certificate
            updated.units[unitIndex].certificates.push({
                Type: '',
                validity_date: '',
                certificat_id: null,
                custom_type: ''
            });

            console.log(`Unit ${unitIndex} now has ${updated.units[unitIndex].certificates.length} certificates`);
            return updated;
        });
    };

    const removeCertificate = (unitIndex, certIndex) => {
        setCompleteCustomerData(prev => {
            const updated = { ...prev };
            updated.units[unitIndex] = {
                ...updated.units[unitIndex],
                certificates: updated.units[unitIndex].certificates.filter((_, i) => i !== certIndex)
            };
            return updated;
        });
    };
    const openCompleteCustomerModal = () => {
        setEditingCustomer(null);
        setCompleteCustomerData({
            group: {
                supplier_name: '',
                description: ''
            },
            units: []
        });
        setFormErrors({});
        setIsCompleteCustomerModalOpen(true);
    };

    const openEditGroupModal = (group) => {
        setSelectedGroup(group);
        setFormData({
            supplier_name: group.supplier_name,
            description: group.description || ''
        });
        setFormErrors({});
        setIsGroupModalOpen(true);
    };

    const openEditCompleteCustomerModal = async (customer) => {
        try {
            setLoading(true);

            console.log('🔍 Opening edit modal for customer:', customer.supplier_name);

            // Always fetch fresh data from the complete endpoint
            const response = await fetch(`https://supplier-back.azurewebsites.net/ajouter/api/groups/${customer.supplier_id}/complete`);
            if (!response.ok) throw new Error('Failed to fetch customer details');

            const customerData = await response.json();
            console.log('🔍 Complete customer data from backend:', {
                units: customerData.units?.length,
                firstUnit: customerData.units?.[0],
                certificatesInFirstUnit: customerData.units?.[0]?.certificates
            });

            setEditingCustomer(customerData);

            // IMPORTANT: Map ALL unit properties
            setCompleteCustomerData({
                group: {
                    supplier_name: customerData.supplier_name,
                    description: customerData.description || ''
                },
                units: (customerData.units || []).map(unit => ({
                    // Basic Information
                    unit_id: unit.unit_id,
                    unit_name: unit.unit_name || '',
                    city: unit.city || '',
                    country: unit.country || '',
                    com_person_id: unit.com_person_id || null,
                    zone_name: unit.zone_name || '',

                    // Account Information
                    account_name: unit.account_name || '',
                    parent_account: unit.parent_account || '',
                    key_account: unit.key_account || false,
                    ke_account_manager: unit.ke_account_manager || '',
                    avo_carbon_main_contact: unit.avo_carbon_main_contact || '',
                    avo_carbon_tech_lead: unit.avo_carbon_tech_lead || '',
                    type: unit.type || '',
                    industry: unit.industry || '',
                    account_owner: unit.account_owner || '',
                    phone: unit.phone || '',
                    website: unit.website || '',
                    employees: unit.employees || '',
                    useful_information: unit.useful_information || '',
                    billing_account_number: unit.billing_account_number || '',
                    product_family: unit.product_family || '',
                    account_currency: unit.account_currency || '',

                    // Company Information
                    start_year: unit.start_year || '',
                    solvent_customer: unit.solvent_customer || '',
                    solvency_info: unit.solvency_info || '',
                    budget_avo_carbon: unit.budget_avo_carbon || '',
                    avo_carbon_potential_buisness: unit.avo_carbon_potential_buisness || '',

                    // Address Information
                    billing_address_search: unit.billing_address_search || '',
                    billing_street: unit.billing_street || '',
                    billing_city: unit.billing_city || '',
                    billing_state: unit.billing_state || '',
                    billing_zip: unit.billing_zip || '',
                    billing_country: unit.billing_country || '',
                    shippping_address_search: unit.shippping_address_search || '',
                    shipping_street: unit.shipping_street || '',
                    shipping_city: unit.shipping_city || '',
                    shipping_state: unit.shipping_state || '',
                    shipping_zip: unit.shipping_zip || '',
                    shipping_country: unit.shipping_country || '',
                    copy_billing: unit.copy_billing || false,

                    // Agreements
                    confidentiality_agreement: unit.confidentiality_agreement || false,
                    quality_agreement: unit.quality_agreement || false,
                    terms_purshase: unit.terms_purshase || '',
                    logistics_agreement: unit.logistics_agreement || false,
                    payment_conditions: unit.payment_conditions || '',
                    tech_key_account: unit.tech_key_account || '',

                    // Responsible Person
                    responsible: unit.responsible ? {
                        Person_id: unit.responsible.Person_id,
                        first_name: unit.responsible.first_name || '',
                        last_name: unit.responsible.last_name || '',
                        job_title: unit.responsible.job_title || '',
                        email: unit.responsible.email || '',
                        phone_number: unit.responsible.phone_number || '',
                        role: unit.responsible.role || 'Contact',
                        zone_name: unit.responsible.zone_name || ''
                    } : {
                        Person_id: null,
                        first_name: '',
                        last_name: '',
                        job_title: '',
                        email: '',
                        phone_number: '',
                        role: 'Contact',
                        zone_name: ''
                    },

                    // Certificates - IMPORTANT: Ensure this is always an array
                    certificates: (unit.certificates || []).map(cert => {
                        console.log('📋 Certificate data:', cert);
                        return {
                            certificat_id: cert.certificat_id || null,
                            Type: cert.Type || '', // Make sure this matches backend response
                            validity_date: cert.validity_date || '', // Make sure this matches backend response
                            custom_type: cert.custom_type || ''
                        };
                    })
                }))
            });

            console.log('✅ CompleteCustomerData after mapping:', {
                units: completeCustomerData.units?.length,
                firstUnitName: completeCustomerData.units?.[0]?.unit_name,
                certificatesCount: completeCustomerData.units?.[0]?.certificates?.length
            });

            setFormErrors({});
            setIsCompleteCustomerModalOpen(true);
        } catch (err) {
            console.error('Error fetching customer:', err);
            setError(err.message);
            toast.error(`Error loading customer data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const openDeleteGroupModal = (group) => {
        setGroupToDelete(group);
        setIsDeleteModalOpen(true);
    };

    const closeModals = () => {
        setIsUnitModalOpen(false);
        setIsGroupModalOpen(false);
        setIsCompleteCustomerModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedUnit(null);
        setSelectedGroup(null);
        setGroupToDelete(null);
        setEditingCustomer(null);
        setFormErrors({});
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleCompleteCustomerChange = (path, value) => {
        setCompleteCustomerData(prev => {
            const keys = path.split('.');
            const updated = { ...prev };
            let current = updated;

            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = value;
            return updated;
        });
    };

    const handleUnitChange = (unitIndex, field, value) => {
        setCompleteCustomerData(prev => {
            const updated = { ...prev };
            updated.units[unitIndex] = { ...updated.units[unitIndex] };
            updated.units[unitIndex][field] = value;
            return updated;
        });
    };

    const handleResponsibleChange = (unitIndex, field, value) => {
        setCompleteCustomerData(prev => {
            const updated = { ...prev };
            updated.units[unitIndex] = { ...updated.units[unitIndex] };
            updated.units[unitIndex].responsible = { ...updated.units[unitIndex].responsible };
            updated.units[unitIndex].responsible[field] = value;
            return updated;
        });
    };

    const addUnit = () => {
        setCompleteCustomerData(prev => ({
            ...prev,
            units: [
                ...prev.units,
                {
                    unit_name: '',
                    city: '',
                    country: '',
                    zone_name: '',
                    // Account Information
                    account_name: '',
                    parent_account: '',
                    key_account: false,
                    ke_account_manager: '',
                    avo_carbon_main_contact: '',
                    avo_carbon_tech_lead: '',
                    type: '',
                    industry: '',
                    account_owner: '',
                    phone: '',
                    website: '',
                    employees: '',
                    useful_information: '',
                    billing_account_number: '',
                    product_family: '',
                    account_currency: '',
                    // Company Information
                    start_year: '',
                    solvent_customer: '',
                    solvency_info: '',
                    budget_avo_carbon: '',
                    avo_carbon_potential_buisness: '',
                    // Address Information
                    billing_address_search: '',
                    billing_street: '',
                    billing_city: '',
                    billing_state: '',
                    billing_zip: '',
                    billing_country: '',
                    shippping_address_search: '',
                    shipping_street: '',
                    shipping_city: '',
                    shipping_state: '',
                    shipping_zip: '',
                    shipping_country: '',
                    copy_billing: false,
                    // Agreements
                    confidentiality_agreement: false,
                    quality_agreement: false,
                    terms_purshase: '',
                    logistics_agreement: false,
                    payment_conditions: '',
                    tech_key_account: '',
                    // Responsible Person
                    responsible: {
                        Person_id: null,
                        first_name: '',
                        last_name: '',
                        job_title: '',
                        email: '',
                        phone_number: '',
                        role: 'Contact',
                        zone_name: ''
                    },
                    certificates: []
                }
            ]
        }));
    };

    const removeUnit = (index) => {
        if (completeCustomerData.units.length > 1 || !editingCustomer) {
            setCompleteCustomerData(prev => ({
                ...prev,
                units: prev.units.filter((_, i) => i !== index)
            }));
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.supplier_name.trim()) {
            errors.supplier_name = 'Group name is required';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateCompleteCustomer = () => {
        const errors = {};

        // Check group name
        if (!completeCustomerData?.group?.supplier_name?.trim()) {
            errors.group_name = 'Group name is required';
        }

        // Check units - with null safety
        completeCustomerData.units?.forEach((unit, unitIndex) => {
            if (!unit?.unit_name?.trim()) {
                errors[`unit_${unitIndex}_name`] = `Unit ${unitIndex + 1} name is required`;
            }

            // Check certificates - with null safety
            unit.certificates?.forEach((cert, certIndex) => {
                if (!cert?.Type) {
                    errors[`cert_${unitIndex}_${certIndex}_type`] = `Unit ${unitIndex + 1}, Certificate ${certIndex + 1} type is required`;
                }

                const dateValue = cert?.validity_date || cert?.Date;
                if (!dateValue) {
                    errors[`cert_${unitIndex}_${certIndex}_date`] = `Unit ${unitIndex + 1}, Certificate ${certIndex + 1} validity date is required`;
                }
            });
        });

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitGroup = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const url = selectedGroup
                ? `https://supplier-back.azurewebsites.net/ajouter/api/groups/${selectedGroup.supplier_id}`
                : 'https://supplier-back.azurewebsites.net/ajouter/api/groups';

            const method = selectedGroup ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save group');
            }
            console.log('🔥 Toast launched: Group created/updated');
            toast.success(selectedGroup ? 'Customer updated successfully!' : 'Customer created successfully!');
            await fetchCustomers();
            closeModals();

        } catch (err) {
            setError(err.message);

        }
    };

    const handleSubmitCompleteCustomer = async (e) => {
        e.preventDefault();
        if (!validateCompleteCustomer()) return;

        try {
            setLoading(true);

            if (editingCustomer) {
                // UPDATE EXISTING CUSTOMER
                // 1. Update the group
                const groupResponse = await fetch(`https://supplier-back.azurewebsites.net/ajouter/api/groups/${editingCustomer.supplier_id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(completeCustomerData.group),
                });

                if (!groupResponse.ok) {
                    const errorData = await groupResponse.json();
                    throw new Error(errorData.error || 'Failed to update group');
                }

                // 2. Update or create units with ALL FIELDS
                const unitPromises = completeCustomerData.units.map(async (unit) => {
                    const unitData = {
                        supplier_id: editingCustomer.supplier_id,
                        unit_name: unit.unit_name,
                        city: unit.city || null,
                        country: unit.country || null,
                        com_person_id: unit.responsible?.Person_id || null,
                        zone_name: unit.zone_name || null,
                        // Account Information
                        account_name: unit.account_name || null,
                        parent_account: unit.parent_account || null,
                        key_account: unit.key_account || false,
                        ke_account_manager: unit.ke_account_manager || null,
                        avo_carbon_main_contact: unit.avo_carbon_main_contact || null,
                        avo_carbon_tech_lead: unit.avo_carbon_tech_lead || null,
                        type: unit.type || null,
                        industry: unit.industry || null,
                        account_owner: unit.account_owner || null,
                        phone: unit.phone || null,
                        website: unit.website || null,
                        employees: unit.employees || null,
                        useful_information: unit.useful_information || null,
                        billing_account_number: unit.billing_account_number || null,
                        product_family: unit.product_family || null,
                        account_currency: unit.account_currency || null,
                        // Company Information
                        start_year: unit.start_year || null,
                        solvent_customer: unit.solvent_customer || null,
                        solvency_info: unit.solvency_info || null,
                        budget_avo_carbon: unit.budget_avo_carbon || null,
                        avo_carbon_potential_buisness: unit.avo_carbon_potential_buisness || null,
                        // Address Information
                        billing_address_search: unit.billing_address_search || null,
                        billing_street: unit.billing_street || null,
                        billing_city: unit.billing_city || null,
                        billing_state: unit.billing_state || null,
                        billing_zip: unit.billing_zip || null,
                        billing_country: unit.billing_country || null,
                        shippping_address_search: unit.shippping_address_search || null,
                        shipping_street: unit.shipping_street || null,
                        shipping_city: unit.shipping_city || null,
                        shipping_state: unit.shipping_state || null,
                        shipping_zip: unit.shipping_zip || null,
                        shipping_country: unit.shipping_country || null,
                        copy_billing: unit.copy_billing || false,
                        // Agreements
                        confidentiality_agreement: unit.confidentiality_agreement || false,
                        quality_agreement: unit.quality_agreement || false,
                        terms_purshase: unit.terms_purshase || null,
                        logistics_agreement: unit.logistics_agreement || false,
                        payment_conditions: unit.payment_conditions || null,
                        tech_key_account: unit.tech_key_account || null
                    };

                    let savedUnit;

                    if (unit.unit_id) {
                        // Update existing unit
                        const unitResponse = await fetch(`https://supplier-back.azurewebsites.net/ajouter/api/units/${unit.unit_id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(unitData),
                        });

                        if (!unitResponse.ok) {
                            const errorData = await unitResponse.json();
                            throw new Error(`Failed to update unit ${unit.unit_name}: ${errorData.error || 'Unknown error'}`);
                        }

                        savedUnit = await unitResponse.json();

                        // 3. Handle certificates for this unit
                        await handleUnitCertificates(unit, savedUnit.unit_id);
                    } else {
                        // Create new unit
                        const unitResponse = await fetch('https://supplier-back.azurewebsites.net/ajouter/api/units', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(unitData),
                        });

                        if (!unitResponse.ok) {
                            const errorData = await unitResponse.json();
                            throw new Error(`Failed to create unit ${unit.unit_name}: ${errorData.error || 'Unknown error'}`);
                        }

                        savedUnit = await unitResponse.json();

                        // 3. Handle certificates for this unit
                        await handleUnitCertificates(unit, savedUnit.unit_id);
                    }

                    return savedUnit;
                });

                // Wait for all units to be updated/created
                await Promise.all(unitPromises);
                toast.success('Customer updated successfully!', {
                    position: "top-center",
                    autoClose: 3000,
                    toastClassName: "custom-toast-offset",
                });
            } else {
                // CREATE NEW CUSTOMER
                // 1. First create the group
                const groupResponse = await fetch('https://supplier-back.azurewebsites.net/ajouter/api/groups', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(completeCustomerData.group),
                });

                if (!groupResponse.ok) {
                    const errorData = await groupResponse.json();
                    throw new Error(errorData.error || 'Failed to create group');
                }

                const groupData = await groupResponse.json();
                const groupId = groupData.supplier_id;

                // 2. Then create each unit for this group with ALL FIELDS
                const unitPromises = completeCustomerData.units.map(async (unit) => {
                    const unitData = {
                        supplier_id: groupId,
                        unit_name: unit.unit_name,
                        city: unit.city || null,
                        country: unit.country || null,
                        com_person_id: unit.responsible?.Person_id || null,
                        zone_name: unit.zone_name || null,
                        // Account Information
                        account_name: unit.account_name || null,
                        parent_account: unit.parent_account || null,
                        key_account: unit.key_account || false,
                        ke_account_manager: unit.ke_account_manager || null,
                        avo_carbon_main_contact: unit.avo_carbon_main_contact || null,
                        avo_carbon_tech_lead: unit.avo_carbon_tech_lead || null,
                        type: unit.type || null,
                        industry: unit.industry || null,
                        account_owner: unit.account_owner || null,
                        phone: unit.phone || null,
                        website: unit.website || null,
                        employees: unit.employees || null,
                        useful_information: unit.useful_information || null,
                        billing_account_number: unit.billing_account_number || null,
                        product_family: unit.product_family || null,
                        account_currency: unit.account_currency || null,
                        // Company Information
                        start_year: unit.start_year || null,
                        solvent_customer: unit.solvent_customer || null,
                        solvency_info: unit.solvency_info || null,
                        budget_avo_carbon: unit.budget_avo_carbon || null,
                        avo_carbon_potential_buisness: unit.avo_carbon_potential_buisness || null,
                        // Address Information
                        billing_address_search: unit.billing_address_search || null,
                        billing_street: unit.billing_street || null,
                        billing_city: unit.billing_city || null,
                        billing_state: unit.billing_state || null,
                        billing_zip: unit.billing_zip || null,
                        billing_country: unit.billing_country || null,
                        shippping_address_search: unit.shippping_address_search || null,
                        shipping_street: unit.shipping_street || null,
                        shipping_city: unit.shipping_city || null,
                        shipping_state: unit.shipping_state || null,
                        shipping_zip: unit.shipping_zip || null,
                        shipping_country: unit.shipping_country || null,
                        copy_billing: unit.copy_billing || false,
                        // Agreements
                        confidentiality_agreement: unit.confidentiality_agreement || false,
                        quality_agreement: unit.quality_agreement || false,
                        terms_purshase: unit.terms_purshase || null,
                        logistics_agreement: unit.logistics_agreement || false,
                        payment_conditions: unit.payment_conditions || null,
                        tech_key_account: unit.tech_key_account || null
                    };

                    // Create new unit
                    const unitResponse = await fetch('https://supplier-back.azurewebsites.net/ajouter/api/units', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(unitData),
                    });

                    if (!unitResponse.ok) {
                        const errorData = await unitResponse.json();
                        throw new Error(`Failed to create unit ${unit.unit_name}: ${errorData.error || 'Unknown error'}`);
                    }

                    const savedUnit = await unitResponse.json();

                    // 3. Handle certificates for this unit
                    await handleUnitCertificates(unit, savedUnit.unit_id);

                    return savedUnit;
                });

                // Wait for all units to be created
                await Promise.all(unitPromises);

                toast.success("Customer created successfully!", {
                    position: "top-center",
                    autoClose: 3000,
                    toastClassName: "custom-toast-offset",
                });
            }

            // Refresh the customers list
            await fetchCustomers();
            closeModals();

        } catch (err) {
            console.error('Error saving customer:', err);
            setError(err.message);
            toast.error(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Add this helper function to handle certificates
    const handleUnitCertificates = async (unit, unitId) => {
        try {
            // First, get existing certificates for this unit
            const existingCertsResponse = await fetch(`https://supplier-back.azurewebsites.net/ajouter/api/certificates/by-unit/${unitId}`);
            const existingCertificates = existingCertsResponse.ok ? await existingCertsResponse.json() : [];

            // Get current certificate IDs from the form
            const currentCertIds = unit.certificates
                ? unit.certificates.map(cert => cert.certificat_id).filter(id => id)
                : [];

            // Find certificates to delete (exist in DB but not in current form)
            const certsToDelete = existingCertificates.filter(cert =>
                !currentCertIds.includes(cert.certificat_id)
            );

            // Delete certificates that were removed
            const deletePromises = certsToDelete.map(async (cert) => {
                await fetch(`https://supplier-back.azurewebsites.net/ajouter/api/certificates/${cert.certificat_id}`, {
                    method: 'DELETE',
                });
            });

            // Handle certificate updates/creations
            const updatePromises = (unit.certificates || []).map(async (cert) => {
                const certData = {
                    unit_id: unitId,
                    Type: cert.Type || cert.custom_type || '',
                    Date: cert.validity_date
                };

                if (cert.certificat_id) {
                    // Update existing certificate
                    const certResponse = await fetch(`https://supplier-back.azurewebsites.net/ajouter/api/certificates/${cert.certificat_id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(certData),
                    });

                    if (!certResponse.ok) {
                        throw new Error(`Failed to update certificate for unit ${unit.unit_name}`);
                    }

                    return certResponse.json();
                } else {
                    // Create new certificate
                    const certResponse = await fetch('https://supplier-back.azurewebsites.net/ajouter/api/certificates', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(certData),
                    });

                    if (!certResponse.ok) {
                        throw new Error(`Failed to create certificate for unit ${unit.unit_name}`);
                    }

                    return certResponse.json();
                }
            });

            // Wait for all operations to complete
            await Promise.all([...deletePromises, ...updatePromises]);

        } catch (error) {
            console.error('Error handling certificates:', error);
            throw error;
        }
    };

    const handleDeleteGroup = async () => {
        if (!groupToDelete) return;

        try {
            const response = await fetch(`https://supplier-back.azurewebsites.net/ajouter/api/groups/${groupToDelete.supplier_id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete group');
            }
            console.log('🔥 Toast launched: Group created/updated');
            toast.success('Supplier deleted successfully!', {
                position: "top-center",
                autoClose: 3000,
                toastClassName: "custom-toast-offset",
            });
            await fetchCustomers();
            closeModals();

        } catch (err) {
            setError(err.message);

        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Loading customers...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-message">
                    <i className="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Data</h3>
                    <p>{error}</p>
                    <button onClick={fetchCustomers} className="retry-btn">
                        <i className="fas fa-redo"></i> Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="customer-management">

            {/* Header */}
            <header className="app-header">
                <div className="header-content">
                    <div className="header-title">
                        <i className="fas fa-users"></i>
                        <h1>Supplier Management</h1>
                    </div>
                    <p className="header-subtitle">
                        Manage your suppliers and their units efficiently
                    </p>

                    <div className="header-actions">
                        {/* Search Filter */}
                        <div className="customer-filter-container">
                            <div className="customer-filter">
                                <input
                                    type="text"
                                    placeholder="Search suppliers by supplier name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />

                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="action-buttons">
                            <button className="btn-primary" onClick={openCompleteCustomerModal}>
                                <i className="fas fa-user-plus"></i>
                                Add Complete Supplier
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                <div className="customers-grid">
                    {filteredCustomers.map((customer) => (
                        <CustomerCard
                            key={customer.supplier_id}
                            customer={customer}
                            onUnitClick={fetchUnitDetails}
                            onEditGroupClick={openEditGroupModal}
                            onEditCompleteClick={openEditCompleteCustomerModal}
                            onDeleteClick={openDeleteGroupModal}
                        />
                    ))}
                </div>

                {filteredCustomers.length === 0 && (
                    <div className="empty-state">
                        <i className="fas fa-inbox"></i>
                        <h3>No Suupliers Found</h3>
                        <p>No Suupliers match your search criteria.</p>
                        <button className="btn-primary" onClick={openCompleteCustomerModal}>
                            <i className="fas fa-user-plus"></i>
                            Add Your First Supplier
                        </button>
                    </div>
                )}
            </main>

            {/* Unit Details Modal */}
            {isUnitModalOpen && <UnitModal unit={selectedUnit} onClose={closeModals} />}

            {/* Group Form Modal */}
            {isGroupModalOpen && (
                <GroupModal
                    group={selectedGroup}
                    formData={formData}
                    formErrors={formErrors}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmitGroup}
                    onClose={closeModals}
                />
            )}

            {/* Complete Customer Modal */}
            {isCompleteCustomerModalOpen && (
                <CompleteCustomerModal
                    data={completeCustomerData}
                    formErrors={formErrors}
                    onGroupChange={handleCompleteCustomerChange}
                    onUnitChange={handleUnitChange}
                    onResponsibleChange={handleResponsibleChange}
                    onAddUnit={addUnit}
                    onRemoveUnit={removeUnit}
                    onSubmit={handleSubmitCompleteCustomer}
                    onClose={closeModals}
                    isEditing={!!editingCustomer}
                    // MAKE SURE THESE ARE PASSED:
                    onAddCertificate={addCertificate}
                    onRemoveCertificate={removeCertificate}
                    onCertificateChange={handleCertificateChange}
                />
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <DeleteModal
                    group={groupToDelete}
                    onConfirm={handleDeleteGroup}
                    onClose={closeModals}
                />
            )}


        </div>
    );
};

// Complete Customer Modal Component
// Complete Customer Modal Component
const CompleteCustomerModal = ({
    data,
    formErrors,
    onGroupChange,
    onUnitChange,
    onResponsibleChange,
    onAddUnit,
    onRemoveUnit,
    onSubmit,
    onClose,
    isEditing = false,
    // ADD THESE PROPS:
    onAddCertificate,
    onRemoveCertificate,
    onCertificateChange  // Make sure this prop is passed from parent
}) => {
    const [persons, setPersons] = useState([]);
    const [loadingPersons, setLoadingPersons] = useState(true);
    useEffect(() => {
        const fetchPersons = async () => {
            try {
                setLoadingPersons(true);
                // Use the new endpoint without domain filter
                const response = await fetch('https://supplier-back.azurewebsites.net/ajouter/api/persons');
                if (!response.ok) throw new Error('Failed to fetch persons');
                const personsData = await response.json();
                setPersons(personsData);
            } catch (error) {
                console.error('Error fetching persons:', error);
                setPersons([]);
            } finally {
                setLoadingPersons(false);
            }
        };

        fetchPersons();
    }, []);

    const handlePersonChange = (unitIndex, personId) => {
        // Find the selected person from persons list
        const selectedPersonData = persons.find(person => person.Person_id === parseInt(personId));

        if (selectedPersonData) {
            // Update all responsible person fields
            onResponsibleChange(unitIndex, 'Person_id', selectedPersonData.Person_id);
            onResponsibleChange(unitIndex, 'first_name', selectedPersonData.first_name);
            onResponsibleChange(unitIndex, 'last_name', selectedPersonData.last_name);
            onResponsibleChange(unitIndex, 'job_title', selectedPersonData.job_title || '');
            onResponsibleChange(unitIndex, 'email', selectedPersonData.email || '');
            onResponsibleChange(unitIndex, 'phone_number', selectedPersonData.phone_number || '');
            onResponsibleChange(unitIndex, 'role', selectedPersonData.role || 'Contact');
            onResponsibleChange(unitIndex, 'zone_name', selectedPersonData.zone_name || '');
        } else {
            // Clear all fields if no person selected
            onResponsibleChange(unitIndex, 'Person_id', null);
            onResponsibleChange(unitIndex, 'first_name', '');
            onResponsibleChange(unitIndex, 'last_name', '');
            onResponsibleChange(unitIndex, 'job_title', '');
            onResponsibleChange(unitIndex, 'email', '');
            onResponsibleChange(unitIndex, 'phone_number', '');
            onResponsibleChange(unitIndex, 'role', 'Contact');
            onResponsibleChange(unitIndex, 'zone_name', '');
        }
    };


    // ✅ ADD THIS DEBUGGING EFFECT HERE
    useEffect(() => {
        console.log('🔍 Modal data received:', data);
        console.log('Total units:', data.units?.length || 0);

        data.units?.forEach((unit, idx) => {
            console.log(`Unit ${idx}: ${unit.unit_name || 'Unnamed'}`, {
                hasCertificates: !!unit.certificates,
                certificateCount: unit.certificates?.length || 0,
                certificates: unit.certificates || []
            });
        });
    }, [data]); // This will run whenever 'data' prop changes

    const addFirstUnit = () => {
        onAddUnit();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title">
                        <i className={isEditing ? "fas fa-edit" : "fas fa-user-plus"}></i>
                        <h2>{isEditing ? 'Edit Complete Supplier' : 'Add Complete Supplier'}</h2>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={onSubmit} className="modal-form">
                    {/* Supplier Information */}
                    <div className="form-section">
                        <h3>
                            <i className="fas fa-users"></i> Supplier Information
                        </h3>
                        <div className="form-group">
                            <label htmlFor="group_name" className="form-label">
                                Supplier Name *
                            </label>
                            <input
                                type="text"
                                id="group_name"
                                value={data.group.supplier_name}
                                onChange={(e) => onGroupChange('group.supplier_name', e.target.value)}
                                className={`form-input ${formErrors.group_name ? 'error' : ''}`}
                                placeholder="Enter group name"
                            />
                            {formErrors.group_name && (
                                <span className="error-message">{formErrors.group_name}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="group_description" className="form-label">
                                Description
                            </label>
                            <textarea
                                id="group_description"
                                value={data.group.description}
                                onChange={(e) => onGroupChange('group.description', e.target.value)}
                                className="form-textarea"
                                placeholder="Enter supplier description "
                                rows="3"
                            />
                        </div>
                    </div>

                    {/* Units Section */}
                    <div className="form-section">
                        <div className="section-header">
                            <h3>
                                <i className="fas fa-industry"></i> Units
                                <span className="units-count">({data.units.length})</span>
                            </h3>
                            <button type="button" className="btn-primary btn-sm" onClick={addFirstUnit}>
                                <i className="fas fa-plus"></i> Add Unit
                            </button>
                        </div>

                        {/* Empty State for Units */}
                        {data.units.length === 0 && (
                            <div className="empty-units-state">
                                <div className="empty-units-icon">
                                    <i className="fas fa-industry"></i>
                                </div>
                                <h4>No Units Added Yet</h4>
                                <p>Start by adding your first unit to this supplier group</p>
                            </div>
                        )}

                        {/* Units List */}
                        {data.units.map((unit, unitIndex) => (
                            <div key={unitIndex} className="unit-form-section">
                                <div className="unit-header">
                                    <h4>
                                        <i className="fas fa-factory"></i>
                                        Unit {unitIndex + 1}
                                        {unit.unit_id && <span className="unit-id-badge"> (ID: {unit.unit_id})</span>}
                                    </h4>
                                    <button
                                        type="button"
                                        className="btn-icon btn-delete"
                                        onClick={() => onRemoveUnit(unitIndex)}
                                        title="Remove Unit"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor={`unit_name_${unitIndex}`} className="form-label">
                                            Unit Name *
                                        </label>
                                        <input
                                            type="text"
                                            id={`unit_name_${unitIndex}`}
                                            value={unit.unit_name}
                                            onChange={(e) => onUnitChange(unitIndex, 'unit_name', e.target.value)}
                                            className={`form-input ${formErrors[`unit_${unitIndex}_name`] ? 'error' : ''}`}
                                            placeholder="Enter unit name"
                                        />
                                        {formErrors[`unit_${unitIndex}_name`] && (
                                            <span className="error-message">{formErrors[`unit_${unitIndex}_name`]}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor={`unit_city_${unitIndex}`} className="form-label">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            id={`unit_city_${unitIndex}`}
                                            value={unit.city || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'city', e.target.value)}
                                            className="form-input"
                                            placeholder="Enter city"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`unit_country_${unitIndex}`} className="form-label">
                                            Country
                                        </label>
                                        <input
                                            type="text"
                                            id={`unit_country_${unitIndex}`}
                                            value={unit.country || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'country', e.target.value)}
                                            className="form-input"
                                            placeholder="Enter country"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor={`unit_zone_${unitIndex}`} className="form-label">
                                        Zone
                                    </label>
                                    <input
                                        type="text"
                                        id={`unit_zone_${unitIndex}`}
                                        value={unit.zone_name || ''}
                                        onChange={(e) => onUnitChange(unitIndex, 'zone_name', e.target.value)}
                                        className="form-input"
                                        placeholder="Enter zone"
                                    />
                                </div>

                                {/* Account Information Section */}
                                <div className="section-subheader">
                                    <h5><i className="fas fa-building"></i> Account Information</h5>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor={`account_name_${unitIndex}`} className="form-label">
                                            Account Name
                                        </label>
                                        <input
                                            type="text"
                                            id={`account_name_${unitIndex}`}
                                            value={unit.account_name || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'account_name', e.target.value)}
                                            className="form-input"
                                            placeholder="Account name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`parent_account_${unitIndex}`} className="form-label">
                                            Parent Account
                                        </label>
                                        <input
                                            type="text"
                                            id={`parent_account_${unitIndex}`}
                                            value={unit.parent_account || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'parent_account', e.target.value)}
                                            className="form-input"
                                            placeholder="Parent account"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group checkbox-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                id={`key_account_${unitIndex}`}
                                                checked={unit.key_account || false}
                                                onChange={(e) => onUnitChange(unitIndex, 'key_account', e.target.checked)}
                                                className="checkbox-input"
                                            />
                                            <span className="checkbox-custom"></span>
                                            Key Account
                                        </label>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`ke_account_manager_${unitIndex}`} className="form-label">
                                            Key Account Manager
                                        </label>
                                        <input
                                            type="text"
                                            id={`ke_account_manager_${unitIndex}`}
                                            value={unit.ke_account_manager || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'ke_account_manager', e.target.value)}
                                            className="form-input"
                                            placeholder="Key account manager"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor={`avo_carbon_main_contact_${unitIndex}`} className="form-label">
                                            AVO Carbon Main Contact
                                        </label>
                                        <input
                                            type="text"
                                            id={`avo_carbon_main_contact_${unitIndex}`}
                                            value={unit.avo_carbon_main_contact || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'avo_carbon_main_contact', e.target.value)}
                                            className="form-input"
                                            placeholder="Main contact"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`avo_carbon_tech_lead_${unitIndex}`} className="form-label">
                                            AVO Carbon Tech Lead
                                        </label>
                                        <input
                                            type="text"
                                            id={`avo_carbon_tech_lead_${unitIndex}`}
                                            value={unit.avo_carbon_tech_lead || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'avo_carbon_tech_lead', e.target.value)}
                                            className="form-input"
                                            placeholder="Tech lead"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor={`type_${unitIndex}`} className="form-label">
                                            Type
                                        </label>
                                        <input
                                            type="text"
                                            id={`type_${unitIndex}`}
                                            value={unit.type || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'type', e.target.value)}
                                            className="form-input"
                                            placeholder="Type"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`industry_${unitIndex}`} className="form-label">
                                            Industry
                                        </label>
                                        <input
                                            type="text"
                                            id={`industry_${unitIndex}`}
                                            value={unit.industry || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'industry', e.target.value)}
                                            className="form-input"
                                            placeholder="Industry"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor={`account_owner_${unitIndex}`} className="form-label">
                                            Account Owner
                                        </label>
                                        <input
                                            type="text"
                                            id={`account_owner_${unitIndex}`}
                                            value={unit.account_owner || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'account_owner', e.target.value)}
                                            className="form-input"
                                            placeholder="Account owner"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`phone_${unitIndex}`} className="form-label">
                                            Phone
                                        </label>
                                        <input
                                            type="text"
                                            id={`phone_${unitIndex}`}
                                            value={unit.phone || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'phone', e.target.value)}
                                            className="form-input"
                                            placeholder="Phone"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor={`website_${unitIndex}`} className="form-label">
                                            Website
                                        </label>
                                        <input
                                            type="text"
                                            id={`website_${unitIndex}`}
                                            value={unit.website || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'website', e.target.value)}
                                            className="form-input"
                                            placeholder="Website"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`employees_${unitIndex}`} className="form-label">
                                            Employees
                                        </label>
                                        <input
                                            type="text"
                                            id={`employees_${unitIndex}`}
                                            value={unit.employees || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'employees', e.target.value)}
                                            className="form-input"
                                            placeholder="Employees"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor={`useful_information_${unitIndex}`} className="form-label">
                                        Useful Information
                                    </label>
                                    <textarea
                                        id={`useful_information_${unitIndex}`}
                                        value={unit.useful_information || ''}
                                        onChange={(e) => onUnitChange(unitIndex, 'useful_information', e.target.value)}
                                        className="form-textarea"
                                        placeholder="Useful information"
                                        rows="3"
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor={`billing_account_number_${unitIndex}`} className="form-label">
                                            Billing Account Number
                                        </label>
                                        <input
                                            type="text"
                                            id={`billing_account_number_${unitIndex}`}
                                            value={unit.billing_account_number || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'billing_account_number', e.target.value)}
                                            className="form-input"
                                            placeholder="Billing account number"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`product_family_${unitIndex}`} className="form-label">
                                            Product Family
                                        </label>
                                        <input
                                            type="text"
                                            id={`product_family_${unitIndex}`}
                                            value={unit.product_family || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'product_family', e.target.value)}
                                            className="form-input"
                                            placeholder="Product family"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor={`account_currency_${unitIndex}`} className="form-label">
                                        Account Currency
                                    </label>
                                    <input
                                        type="text"
                                        id={`account_currency_${unitIndex}`}
                                        value={unit.account_currency || ''}
                                        onChange={(e) => onUnitChange(unitIndex, 'account_currency', e.target.value)}
                                        className="form-input"
                                        placeholder="Account currency"
                                    />
                                </div>

                                {/* Company Information Section */}
                                <div className="section-subheader">
                                    <h5><i className="fas fa-info-circle"></i> Company Information</h5>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor={`start_year_${unitIndex}`} className="form-label">
                                            Start Year
                                        </label>
                                        <input
                                            type="number"
                                            id={`start_year_${unitIndex}`}
                                            value={unit.start_year || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'start_year', e.target.value)}
                                            className="form-input"
                                            placeholder="Start year"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`solvent_customer_${unitIndex}`} className="form-label">
                                            Solvent Customer
                                        </label>
                                        <input
                                            type="text"
                                            id={`solvent_customer_${unitIndex}`}
                                            value={unit.solvent_customer || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'solvent_customer', e.target.value)}
                                            className="form-input"
                                            placeholder="Solvent customer"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor={`solvency_info_${unitIndex}`} className="form-label">
                                        Solvency Info
                                    </label>
                                    <input
                                        type="text"
                                        id={`solvency_info_${unitIndex}`}
                                        value={unit.solvency_info || ''}
                                        onChange={(e) => onUnitChange(unitIndex, 'solvency_info', e.target.value)}
                                        className="form-input"
                                        placeholder="Solvency info"
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor={`budget_avo_carbon_${unitIndex}`} className="form-label">
                                            Budget AVO Carbon
                                        </label>
                                        <input
                                            type="text"
                                            id={`budget_avo_carbon_${unitIndex}`}
                                            value={unit.budget_avo_carbon || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'budget_avo_carbon', e.target.value)}
                                            className="form-input"
                                            placeholder="Budget AVO carbon"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`avo_carbon_potential_buisness_${unitIndex}`} className="form-label">
                                            AVO Carbon Potential Business
                                        </label>
                                        <input
                                            type="text"
                                            id={`avo_carbon_potential_buisness_${unitIndex}`}
                                            value={unit.avo_carbon_potential_buisness || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'avo_carbon_potential_buisness', e.target.value)}
                                            className="form-input"
                                            placeholder="Potential business"
                                        />
                                    </div>
                                </div>

                                {/* Address Information Section */}
                                <div className="section-subheader">
                                    <h5><i className="fas fa-map-marker-alt"></i> Address Information</h5>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor={`billing_street_${unitIndex}`} className="form-label">
                                            Billing Street
                                        </label>
                                        <input
                                            type="text"
                                            id={`billing_street_${unitIndex}`}
                                            value={unit.billing_street || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'billing_street', e.target.value)}
                                            className="form-input"
                                            placeholder="Billing street"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor={`billing_city_${unitIndex}`} className="form-label">
                                            Billing City
                                        </label>
                                        <input
                                            type="text"
                                            id={`billing_city_${unitIndex}`}
                                            value={unit.billing_city || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'billing_city', e.target.value)}
                                            className="form-input"
                                            placeholder="Billing city"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`billing_state_${unitIndex}`} className="form-label">
                                            Billing State/Province
                                        </label>
                                        <input
                                            type="text"
                                            id={`billing_state_${unitIndex}`}
                                            value={unit.billing_state || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'billing_state', e.target.value)}
                                            className="form-input"
                                            placeholder="Billing state"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor={`billing_zip_${unitIndex}`} className="form-label">
                                            Billing Zip/Postal Code
                                        </label>
                                        <input
                                            type="text"
                                            id={`billing_zip_${unitIndex}`}
                                            value={unit.billing_zip || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'billing_zip', e.target.value)}
                                            className="form-input"
                                            placeholder="Billing zip"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`billing_country_${unitIndex}`} className="form-label">
                                            Billing Country
                                        </label>
                                        <input
                                            type="text"
                                            id={`billing_country_${unitIndex}`}
                                            value={unit.billing_country || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'billing_country', e.target.value)}
                                            className="form-input"
                                            placeholder="Billing country"
                                        />
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor={`shipping_street_${unitIndex}`} className="form-label">
                                            Shipping Street
                                        </label>
                                        <input
                                            type="text"
                                            id={`shipping_street_${unitIndex}`}
                                            value={unit.shipping_street || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'shipping_street', e.target.value)}
                                            className="form-input"
                                            placeholder="Shipping street"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor={`shipping_city_${unitIndex}`} className="form-label">
                                            Shipping City
                                        </label>
                                        <input
                                            type="text"
                                            id={`shipping_city_${unitIndex}`}
                                            value={unit.shipping_city || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'shipping_city', e.target.value)}
                                            className="form-input"
                                            placeholder="Shipping city"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`shipping_state_${unitIndex}`} className="form-label">
                                            Shipping State/Province
                                        </label>
                                        <input
                                            type="text"
                                            id={`shipping_state_${unitIndex}`}
                                            value={unit.shipping_state || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'shipping_state', e.target.value)}
                                            className="form-input"
                                            placeholder="Shipping state"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor={`shipping_zip_${unitIndex}`} className="form-label">
                                            Shipping Zip/Postal Code
                                        </label>
                                        <input
                                            type="text"
                                            id={`shipping_zip_${unitIndex}`}
                                            value={unit.shipping_zip || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'shipping_zip', e.target.value)}
                                            className="form-input"
                                            placeholder="Shipping zip"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`shipping_country_${unitIndex}`} className="form-label">
                                            Shipping Country
                                        </label>
                                        <input
                                            type="text"
                                            id={`shipping_country_${unitIndex}`}
                                            value={unit.shipping_country || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'shipping_country', e.target.value)}
                                            className="form-input"
                                            placeholder="Shipping country"
                                        />
                                    </div>
                                </div>

                                <div className="form-group checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            id={`copy_billing_${unitIndex}`}
                                            checked={unit.copy_billing || false}
                                            onChange={(e) => onUnitChange(unitIndex, 'copy_billing', e.target.checked)}
                                            className="checkbox-input"
                                        />
                                        <span className="checkbox-custom"></span>
                                        Copy Billing to Shipping
                                    </label>
                                </div>

                                {/* Agreements Section */}
                                <div className="section-subheader">
                                    <h5><i className="fas fa-file-contract"></i> Agreements</h5>
                                </div>

                                <div className="form-row">
                                    <div className="form-group checkbox-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                id={`confidentiality_agreement_${unitIndex}`}
                                                checked={unit.confidentiality_agreement || false}
                                                onChange={(e) => onUnitChange(unitIndex, 'confidentiality_agreement', e.target.checked)}
                                                className="checkbox-input"
                                            />
                                            <span className="checkbox-custom"></span>
                                            Confidentiality Agreement
                                        </label>
                                    </div>
                                    <div className="form-group checkbox-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                id={`quality_agreement_${unitIndex}`}
                                                checked={unit.quality_agreement || false}
                                                onChange={(e) => onUnitChange(unitIndex, 'quality_agreement', e.target.checked)}
                                                className="checkbox-input"
                                            />
                                            <span className="checkbox-custom"></span>
                                            Quality Agreement
                                        </label>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group checkbox-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                id={`logistics_agreement_${unitIndex}`}
                                                checked={unit.logistics_agreement || false}
                                                onChange={(e) => onUnitChange(unitIndex, 'logistics_agreement', e.target.checked)}
                                                className="checkbox-input"
                                            />
                                            <span className="checkbox-custom"></span>
                                            Logistics Agreement
                                        </label>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor={`terms_purshase_${unitIndex}`} className="form-label">
                                            Terms of Purchase
                                        </label>
                                        <input
                                            type="text"
                                            id={`terms_purshase_${unitIndex}`}
                                            value={unit.terms_purshase || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'terms_purshase', e.target.value)}
                                            className="form-input"
                                            placeholder="Terms of purchase"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`payment_conditions_${unitIndex}`} className="form-label">
                                            Payment Conditions
                                        </label>
                                        <input
                                            type="text"
                                            id={`payment_conditions_${unitIndex}`}
                                            value={unit.payment_conditions || ''}
                                            onChange={(e) => onUnitChange(unitIndex, 'payment_conditions', e.target.value)}
                                            className="form-input"
                                            placeholder="Payment conditions"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor={`tech_key_account_${unitIndex}`} className="form-label">
                                        Tech Key Account
                                    </label>
                                    <input
                                        type="text"
                                        id={`tech_key_account_${unitIndex}`}
                                        value={unit.tech_key_account || ''}
                                        onChange={(e) => onUnitChange(unitIndex, 'tech_key_account', e.target.value)}
                                        className="form-input"
                                        placeholder="Tech key account"
                                    />
                                </div>


                                {/* Responsible Person Section */}
                                <div className="section-subheader">
                                    <h5><i className="fas fa-user-tie"></i> Responsible Person</h5>
                                </div>

                                <div className="form-group">
                                    <label htmlFor={`responsible_person_${unitIndex}`} className="form-label">
                                        Select Responsible Person
                                    </label>
                                    <select
                                        id={`responsible_person_${unitIndex}`}
                                        value={unit.responsible?.Person_id || ''}
                                        onChange={(e) => handlePersonChange(unitIndex, e.target.value)}
                                        className="form-input"
                                    >
                                        <option value="">-- Select a person --</option>
                                        {loadingPersons ? (
                                            <option value="" disabled>Loading persons...</option>
                                        ) : persons.length > 0 ? (
                                            persons.map((person) => (
                                                <option key={person.Person_id} value={person.Person_id}>
                                                    {person.first_name} {person.last_name}
                                                    {person.job_title ? ` - ${person.job_title}` : ''}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>No persons found</option>
                                        )}
                                    </select>
                                </div>

                      

                                {/* ==================== CERTIFICATES SECTION ==================== */}
                                {/* MOVE THIS INSIDE THE UNIT MAPPING */}
                                <div className="unit-certificates-section">
                                    <div className="section-subheader">
                                        <div className="section-header">
                                            <h5><i className="fas fa-certificate"></i> Unit Certificates</h5>
                                            <button
                                                type="button"
                                                className="btn-primary btn-sm"
                                                onClick={() => onAddCertificate(unitIndex)}

                                            >
                                                <i className="fas fa-plus"></i> Add Certificate
                                            </button>
                                        </div>
                                    </div>

                                    {/* Empty State for Certificates */}
                                    {(!unit.certificates || unit.certificates.length === 0) && (
                                        <div className="empty-certificates-state">
                                            <div className="empty-certificates-icon">
                                                <i className="fas fa-certificate"></i>
                                            </div>
                                            <h4>No Certificates Added Yet</h4>
                                            <p>Add certificates for this unit (e.g., ISO standards, compliance certificates)</p>
                                        </div>
                                    )}

                                    {/* Certificates List */}
                                    {unit.certificates && unit.certificates.map((cert, certIndex) => (
                                        <div key={certIndex} className="certificate-form-section">
                                            <div className="certificate-header">
                                                <h6>
                                                    <i className="fas fa-file-certificate"></i>
                                                    Certificate {certIndex + 1}
                                                    {cert.certificat_id && <span className="cert-id-badge"> (ID: {cert.certificat_id})</span>}
                                                </h6>
                                                <button
                                                    type="button"
                                                    className="btn-icon btn-delete"
                                                    onClick={() => onRemoveCertificate(unitIndex, certIndex)}
                                                    title="Remove Certificate"
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label htmlFor={`cert_type_${unitIndex}_${certIndex}`} className="form-label">
                                                        Certificate Type *
                                                    </label>
                                                    <select
                                                        id={`cert_type_${unitIndex}_${certIndex}`}
                                                        value={cert.Type || ''}
                                                        onChange={(e) => onCertificateChange(unitIndex, certIndex, 'Type', e.target.value)}
                                                        className={`form-input ${formErrors[`cert_${unitIndex}_${certIndex}_type`] ? 'error' : ''}`}
                                                    >
                                                        <option value="">Select certificate type</option>
                                                        <option value="ISO 9001">ISO 9001 - Quality Management</option>
                                                        <option value="ISO 14001">ISO 14001 - Environmental Management</option>
                                                        <option value="ISO 45001">ISO 45001 - Occupational Health & Safety</option>
                                                        <option value="IATF 16949">IATF 16949 - Automotive Quality</option>
                                                        <option value="AS9100">AS9100 - Aerospace Quality</option>
                                                        <option value="ISO 13485">ISO 13485 - Medical Devices</option>
                                                        <option value="ISO 27001">ISO 27001 - Information Security</option>
                                                        <option value="FDA">FDA - Food and Drug Administration</option>
                                                        <option value="CE Marking">CE Marking</option>
                                                        <option value="RoHS">RoHS Compliance</option>
                                                        <option value="REACH">REACH Compliance</option>
                                                        <option value="UL">UL Certification</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                    {formErrors[`cert_${unitIndex}_${certIndex}_type`] && (
                                                        <span className="error-message">{formErrors[`cert_${unitIndex}_${certIndex}_type`]}</span>
                                                    )}
                                                </div>

                                                <div className="form-group">
                                                    <label htmlFor={`cert_date_${unitIndex}_${certIndex}`} className="form-label">
                                                        Validity Date *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        id={`cert_date_${unitIndex}_${certIndex}`}
                                                        value={cert.validity_date || ''}
                                                        onChange={(e) => onCertificateChange(unitIndex, certIndex, 'validity_date', e.target.value)}
                                                        className={`form-input ${formErrors[`cert_${unitIndex}_${certIndex}_date`] ? 'error' : ''}`}
                                                    />
                                                    {formErrors[`cert_${unitIndex}_${certIndex}_date`] && (
                                                        <span className="error-message">{formErrors[`cert_${unitIndex}_${certIndex}_date`]}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {cert.Type === 'Other' && (
                                                <div className="form-group">
                                                    <label htmlFor={`cert_custom_type_${unitIndex}_${certIndex}`} className="form-label">
                                                        Custom Certificate Type
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id={`cert_custom_type_${unitIndex}_${certIndex}`}
                                                        value={cert.custom_type || ''}
                                                        onChange={(e) => onCertificateChange(unitIndex, certIndex, 'custom_type', e.target.value)}
                                                        className="form-input"
                                                        placeholder="Specify custom certificate type"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                            </div>
                        ))}

                        {/* Add Unit Button at Bottom */}
                        {data.units.length > 0 && (
                            <div className="add-unit-footer">
                                <button type="button" className="btn-secondary" onClick={onAddUnit}>
                                    <i className="fas fa-plus"></i>
                                    Add Another Unit
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            <i className="fas fa-times"></i>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            <i className="fas fa-save"></i>
                            {isEditing
                                ? 'Update Supplier'
                                : (data.units.length === 0 ? 'Create Only Supplier' : 'Create Complete Supplier')
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Customer Card Component
const CustomerCard = ({ customer, onUnitClick, onEditGroupClick, onEditCompleteClick, onDeleteClick }) => {
    const fallbackCategory = customer.description?.toLowerCase().includes('automobile') ? 'automobile' : 'industry';
    const { clearbitUrl, googleFaviconUrl, genericFallback } = getCompanyLogo(customer.supplier_name, fallbackCategory);

    const [unitSearchTerm, setUnitSearchTerm] = useState('');

    const filteredUnits = customer.units.filter((unit) =>
        unit.unit_name.toLowerCase().includes(unitSearchTerm.toLowerCase())
    );

    return (
        <div className="customer-card">
            <div className="customer-header">
                <div className="customer-icon">
                    <img
                        src={clearbitUrl}
                        alt={`${customer.supplier_name} logo`}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = googleFaviconUrl;
                            e.target.onError = () => (e.target.src = genericFallback);
                        }}
                        className="customer-logo"
                    />
                </div>

                <div className="customer-info">
                    <div className="customer-title-section">
                        <h3 className="customer-name">{customer.supplier_name}</h3>
                        <div className="customer-actions">
                            <button
                                className="btn-icon btn-edit"
                                onClick={() => onEditCompleteClick(customer)}
                                title="Edit Complete Customer"
                            >
                                <i className="fas fa-edit fa-sm"></i>
                            </button>
                            <button
                                className="btn-icon btn-delete"
                                onClick={() => onDeleteClick(customer)}
                                title="Delete Group"
                            >
                                <i className="fas fa-trash-alt fa-sm"></i>
                            </button>
                        </div>
                    </div>

                    {customer.description && (
                        <p className="customer-description">{customer.description}</p>
                    )}

                    <div className="input-wrapper">
                        <input
                            type="text"
                            placeholder="Search units..."
                            className="customer-input"
                            value={unitSearchTerm}
                            onChange={(e) => setUnitSearchTerm(e.target.value)}
                        />
                        <span className="input-icon">🔍</span>
                    </div>
                </div>
            </div>

            <div className="units-section">
                <div className="units-header">
                    <h4>
                        <i className="fas fa-industry"></i>
                        Units ({filteredUnits.length})
                    </h4>
                </div>
                <div className="units-list">
                    {filteredUnits.length > 0 ? (
                        filteredUnits.map((unit) => (
                            <UnitItem
                                key={unit.unit_id}
                                unit={unit}
                                onClick={() => onUnitClick(unit.unit_id)}
                            />
                        ))
                    ) : (
                        <p className="no-units">No units found</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Group Form Modal Component
const GroupModal = ({ group, formData, formErrors, onInputChange, onSubmit, onClose }) => {
    const isEditing = !!group;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title">
                        <i className="fas fa-users"></i>
                        <h2>{isEditing ? 'Edit Group' : 'Create New Group'}</h2>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={onSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="supplier_name" className="form-label">
                            Group Name *
                        </label>
                        <input
                            type="text"
                            id="supplier_name"
                            name="supplier_name"
                            value={formData.supplier_name}
                            onChange={onInputChange}
                            className={`form-input ${formErrors.supplier_name ? 'error' : ''}`}
                            placeholder="Enter group name"
                        />
                        {formErrors.supplier_name && (
                            <span className="error-message">{formErrors.supplier_name}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="description" className="form-label">
                            description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={onInputChange}
                            className="form-textarea"
                            placeholder="Enter group description (optional)"
                            rows="4"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            {isEditing ? 'Update Group' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Delete Confirmation Modal Component
const DeleteModal = ({ group, onConfirm, onClose }) => {
    if (!group) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title">
                        <i className="fas fa-exclamation-triangle warning-icon"></i>
                        <h2>Delete Group</h2>
                    </div>
                </div>

                <div className="modal-body">
                    <p>Are you sure you want to delete the group <strong>"{group.supplier_name}"</strong>?</p>
                    {group.units && group.units.length > 0 && (
                        <div className="warning-message">
                            <i className="fas fa-exclamation-circle"></i>
                            <span>This group has {group.units.length} unit(s). Deleting it will also remove all associated units.</span>
                        </div>
                    )}
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="button" className="btn-danger" onClick={onConfirm}>
                        Delete Group
                    </button>
                </div>
            </div>
        </div>
    );
};

// Unit Item Component
const UnitItem = ({ unit, onClick }) => (
    <div className="unit-item" onClick={onClick}>
        <div className="unit-info">
            <div className="unit-name">
                <i className="fas fa-factory"></i>
                {unit.unit_name}
                {/* ADD THIS: Certificate count badge */}
                {unit.certificates && unit.certificates.length > 0 && (
                    <span className="certificate-count-badge">
                        <i className="fas fa-certificate"></i>
                        {unit.certificates.length}
                    </span>
                )}
            </div>
            <div className="unit-details">
                {unit.city && (
                    <span className="unit-location">
                        <i className="fas fa-map-marker-alt"></i>
                        {unit.city}
                        {unit.country && `, ${unit.country}`}
                    </span>
                )}
                {unit.zone_name && (
                    <span className="unit-zone">
                        <i className="fas fa-map"></i>
                        {unit.zone_name}
                    </span>
                )}
            </div>
        </div>
        <div className="unit-arrow">
            <i className="fas fa-chevron-right"></i>
        </div>
    </div>
);

// Unit Modal Component
const UnitModal = ({ unit, onClose }) => {
    if (!unit) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title">
                        <i className="fas fa-factory"></i>
                        <h2>{unit.unit_name}</h2>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="detail-section">
                        <h3>
                            <i className="fas fa-info-circle"></i> Unit Information
                        </h3>
                        <div className="detail-grid">
                            <DetailItem label="Unit Name" value={unit.unit_name} />
                            <DetailItem label="Group" value={unit.supplier_name} />
                            <DetailItem label="City" value={unit.city} />
                            <DetailItem label="Country" value={unit.country} />
                            <DetailItem label="Zone" value={unit.zone_name} />

                        </div>
                    </div>
                    {/* Account Information */}
                    <div className="detail-section">
                        <h3>
                            <i className="fas fa-building"></i> Account Information
                        </h3>
                        <div className="detail-grid">
                            <DetailItem label="Account Name" value={unit.account_name} />
                            <DetailItem label="Parent Account" value={unit.parent_account} />
                            <DetailItem label="Key Account" value={unit.key_account ? 'Yes' : 'No'} />
                            <DetailItem label="Key Account Manager" value={unit.ke_account_manager} />
                            <DetailItem label="AVO Carbon Main Contact" value={unit.avo_carbon_main_contact} />
                            <DetailItem label="AVO Carbon Tech Lead" value={unit.avo_carbon_tech_lead} />
                            <DetailItem label="Type" value={unit.type} />
                            <DetailItem label="Industry" value={unit.industry} />
                            <DetailItem label="Account Owner" value={unit.account_owner} />
                            <DetailItem label="Phone" value={unit.phone} isPhone />
                            <DetailItem label="Website" value={unit.website} />
                            <DetailItem label="Employees" value={unit.employees} />
                            <DetailItem label="Useful Information" value={unit.useful_information} />
                            <DetailItem label="Billing Account Number" value={unit.billing_account_number} />
                            <DetailItem label="Product Family" value={unit.product_family} />
                            <DetailItem label="Account Currency" value={unit.account_currency} />
                        </div>
                    </div>

                    {/* Company Information */}
                    <div className="detail-section">
                        <h3>
                            <i className="fas fa-info-circle"></i> Company Information
                        </h3>
                        <div className="detail-grid">
                            <DetailItem label="Start Year" value={unit.start_year} />
                            <DetailItem label="Solvent Customer" value={unit.solvent_customer} />
                            <DetailItem label="Solvency Info" value={unit.solvency_info} />
                            <DetailItem label="Budget AVO Carbon" value={unit.budget_avo_carbon} />
                            <DetailItem label="AVO Carbon Potential Business" value={unit.avo_carbon_potential_buisness} />
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className="detail-section">
                        <h3>
                            <i className="fas fa-map-marker-alt"></i> Address Information
                        </h3>

                        <div className="address-section">
                            <h4>Billing Address</h4>
                            <div className="detail-grid">
                                <DetailItem label="Billing Street" value={unit.billing_street} />
                                <DetailItem label="Billing City" value={unit.billing_city} />
                                <DetailItem label="Billing State/Province" value={unit.billing_state} />
                                <DetailItem label="Billing Zip/Postal Code" value={unit.billing_zip} />
                                <DetailItem label="Billing Country" value={unit.billing_country} />
                            </div>
                        </div>

                        <div className="address-section">
                            <h4>Shipping Address</h4>
                            <div className="detail-grid">
                                <DetailItem label="Shipping Street" value={unit.shipping_street} />
                                <DetailItem label="Shipping City" value={unit.shipping_city} />
                                <DetailItem label="Shipping State/Province" value={unit.shipping_state} />
                                <DetailItem label="Shipping Zip/Postal Code" value={unit.shipping_zip} />
                                <DetailItem label="Shipping Country" value={unit.shipping_country} />
                            </div>
                        </div>

                        <DetailItem label="Copy Billing to Shipping" value={unit.copy_billing ? 'Yes' : 'No'} />
                    </div>

                    {/* Agreements */}
                    <div className="detail-section">
                        <h3>
                            <i className="fas fa-file-contract"></i> Agreements
                        </h3>
                        <div className="detail-grid">
                            <DetailItem label="Confidentiality Agreement" value={unit.confidentiality_agreement ? 'Yes' : 'No'} />
                            <DetailItem label="Quality Agreement" value={unit.quality_agreement ? 'Yes' : 'No'} />
                            <DetailItem label="Logistics Agreement" value={unit.logistics_agreement ? 'Yes' : 'No'} />
                            <DetailItem label="Terms of Purchase" value={unit.terms_purshase ? 'Yes' : 'No'} />
                            <DetailItem label="Payment Conditions" value={unit.payment_conditions} />
                            <DetailItem label="Tech Key Account" value={unit.tech_key_account} />
                        </div>
                    </div>

                    {unit.responsible && (
                        <div className="detail-section">
                            <h3>
                                <i className="fas fa-user-tie"></i> Responsible Person
                            </h3>
                            <div className="responsible-card">
                                <div className="responsible-header">
                                    <div className="person-avatar">
                                        <i className="fas fa-user"></i>
                                    </div>
                                    <div className="person-info">
                                        <h4>
                                            {unit.responsible.first_name} {unit.responsible.last_name}
                                        </h4>
                                        <p className="person-role">
                                            <span
                                                className={`role-badge ${unit.responsible.role?.toLowerCase()}`}
                                            >
                                                {unit.responsible.role}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="person-details">
                                    <DetailItem
                                        label="Job Title"
                                        value={unit.responsible.job_title}
                                        icon="fas fa-briefcase"
                                    />
                                    <DetailItem
                                        label="Email"
                                        value={unit.responsible.email}
                                        icon="fas fa-envelope"
                                        isEmail
                                    />
                                    <DetailItem
                                        label="Phone"
                                        value={unit.responsible.phone_number}
                                        icon="fas fa-phone"
                                        isPhone
                                    />
                                    <DetailItem
                                        label="Zone"
                                        value={unit.responsible.zone_name}
                                        icon="fas fa-map-marker-alt"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* ==================== CERTIFICATES SECTION ==================== */}
                {unit.certificates && unit.certificates.length > 0 && (
                    <div className="detail-section">
                        <h3>
                            <i className="fas fa-certificate"></i> Unit Certificates
                        </h3>
                        <div className="certificates-grid">
                            {unit.certificates.map((cert) => (
                                <div key={cert.certificat_id} className="certificate-card">
                                    <div className="certificate-header">
                                        <i className="fas fa-certificate certificate-icon"></i>
                                        <span className="certificate-type">{cert.Type}</span>
                                    </div>
                                    <div className="certificate-details">
                                        <DetailItem
                                            label="Validity Date"
                                            value={cert.validity_date}
                                            icon="fas fa-calendar-alt"
                                        />

                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Detail Item Component
const DetailItem = ({ label, value, icon, isEmail = false, isPhone = false }) => {
    if (!value) return null;
    let content = value;
    if (isEmail) content = <a href={`mailto:${value}`}>{value}</a>;
    if (isPhone) content = <a href={`tel:${value}`}>{value}</a>;

    return (
        <div className="detail-item">
            <div className="detail-label">
                {icon && <i className={icon}></i>}
                {label}
            </div>
            <div className="detail-value">{content}</div>
        </div>
    );
};

// Utility function: Get logo with multiple fallbacks
const getCompanyLogo = (companyName, fallbackCategory = 'industry') => {
    if (!companyName) return `/default-${fallbackCategory}.png`;

    const domain = companyName.replace(/\s+/g, '').toLowerCase() + '.com';
    const clearbitUrl = `https://logo.clearbit.com/${domain}`;
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}`;
    const genericFallback = `/default-${fallbackCategory}.png`;

    return { clearbitUrl, googleFaviconUrl, genericFallback };
};

export default SupplierManagement;
