import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './SupplierManagement.css';


// Add this PlantTree component after the PlantModal component
const PlantTree = ({ plant, onClose }) => {
    if (!plant) return null;

    const getFileUrl = (filePath) => {
        if (!filePath) return null;
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }
        return `https://supplier-back.azurewebsites.net${filePath}`;
    };

    const getPlantType = (plantName) => {
        const plantNameLower = plantName?.toLowerCase() || '';
        if (plantNameLower.includes('sceet') || plantNameLower.includes('same') ||
            plantNameLower.includes('anhui') || plantNameLower.includes('india') ||
            plantNameLower.includes('korea')) {
            return 'Manufacturing';
        } else if (plantNameLower.includes('monterrey')) {
            return 'Assembly';
        } else if (plantNameLower.includes('kunshan') || plantNameLower.includes('tianjin')) {
            return 'Production';
        } else if (plantNameLower.includes('poitiers')) {
            return 'R&D';
        } else if (plantNameLower.includes('cyclam')) {
            return 'Development';
        } else if (plantNameLower.includes('frankfurt')) {
            return 'Sales';
        } else {
            return 'Manufacturing';
        }
    };

    const formatPlantName = (plantName) => {
        if (!plantName) return '';
        return plantName.charAt(0).toUpperCase() + plantName.slice(1);
    };

    const plantType = getPlantType(plant.plant);
    const formattedPlantName = formatPlantName(plant.plant);

    return (
        <div className="plant-tree-container">
            {/* Tree structure */}
            <div className="plant-tree">
                {/* Level 1: Plant Name */}
                <div className="tree-level tree-level-1">
                    <div className="tree-node plant-tree-header">
                        <div className="plant-tree-icon">
                            <i className="fas fa-industry"></i>
                        </div>
                        <div className="plant-tree-title">
                            <h3>{formattedPlantName} {plant.alias && `(${plant.alias})`}</h3>
                            <div className="plant-tree-subtitle">
                                <span className="plant-type">({plantType})</span>
                                {plant.plant_id && <span style={{ marginLeft: '10px', color: '#a0aec0' }}>ID: {plant.plant_id}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Level 2: Plant Information (collapsible) */}
                <div className="tree-level tree-level-2">
                    <div className="tree-node plant-tree-body">
                        <div className="plant-info-grid">
                            <div className="plant-info-item">
                                <div className="plant-info-label">
                                    <i className="fas fa-user"></i>
                                    Acheteur AVO
                                </div>
                                <div className="plant-info-value">
                                    {plant.Acheteur_avo || 'Not specified'}
                                </div>
                            </div>

                            <div className="plant-info-item">
                                <div className="plant-info-label">
                                    <i className="fas fa-file-invoice-dollar"></i>
                                    TOP
                                </div>
                                <div className="plant-info-value">
                                    {plant.top || 'Not specified'}
                                </div>
                            </div>

                            <div className="plant-info-item">
                                <div className="plant-info-label">
                                    <i className="fas fa-truck"></i>
                                    Incoterms
                                </div>
                                <div className="plant-info-value">
                                    {plant.incoterms || 'Not specified'}
                                </div>
                            </div>

                            <div className="plant-info-item">
                                <div className="plant-info-label">
                                    <i className="fas fa-map-marker-alt"></i>
                                    Place of Incoterms
                                </div>
                                <div className="plant-info-value">
                                    {plant.place_of_incoterms || 'Not specified'}
                                </div>
                            </div>

                            <div className="plant-info-item">
                                <div className="plant-info-label">
                                    <i className="fas fa-info-circle"></i>
                                    Status
                                </div>
                                <div className="plant-info-value">
                                    <span className={`plant-status-badge ${plant.delivered ? 'status-delivered' : 'status-pending'}`}>
                                        {plant.delivered ? 'Delivered' : 'Pending'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {plant.fichier_accord && (
                            <div className="plant-file-preview">
                                <h4>
                                    <i className="fas fa-file-contract"></i>
                                    Fichier d'Accord
                                </h4>
                                <div className="file-preview-actions">
                                    <a href={getFileUrl(plant.fichier_accord)} target="_blank" rel="noopener noreferrer">
                                        <i className="fas fa-eye"></i> View File
                                    </a>

                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Level 3: Optional additional information (collapsed by default) */}
                {plant.additionalInfo && (
                    <div className="tree-level tree-level-3 collapsed">
                        <div className="tree-node">
                            <h4><i className="fas fa-info-circle"></i> Additional Information</h4>
                            <p>{plant.additionalInfo}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

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
        responsible_group: '',
        description: ''
    });
    const [completeCustomerData, setCompleteCustomerData] = useState({
        group: {
            supplier_name: '',
            responsible_group: '',
            description: ''
        },
        units: []
    });
    const [formErrors, setFormErrors] = useState({});
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [selectedPlant, setSelectedPlant] = useState(null);
    const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
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

            // For each customer, fetch certificates and plants for their units
            const customersWithAllData = await Promise.all(
                data.map(async (customer) => {
                    const unitsWithAllData = await Promise.all(
                        customer.units.map(async (unit) => {
                            try {
                                // Fetch certificates for this unit
                                const certResponse = await fetch(`https://supplier-back.azurewebsites.net/ajouter/api/certificates/by-unit/${unit.unit_id}`);
                                const certificates = certResponse.ok ? await certResponse.json() : [];

                                // Fetch plants for this unit
                                const plantsResponse = await fetch(`https://supplier-back.azurewebsites.net/ajouter/api/plants/by-unit/${unit.unit_id}`);
                                const plants = plantsResponse.ok ? await plantsResponse.json() : [];

                                return {
                                    ...unit,
                                    certificates,
                                    plants
                                };
                            } catch (error) {
                                console.error(`Error fetching data for unit ${unit.unit_id}:`, error);
                                return unit;
                            }
                        })
                    );

                    return {
                        ...customer,
                        units: unitsWithAllData
                    };
                })
            );

            setCustomers(customersWithAllData);
            setFilteredCustomers(customersWithAllData);
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

            // Fetch plants for this unit
            const plantsResponse = await fetch(`https://supplier-back.azurewebsites.net/ajouter/api/plants/by-unit/${unitId}`);
            if (plantsResponse.ok) {
                const plants = await plantsResponse.json();
                unitData.plants = plants;
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
            console.log('🔍 Modal opened with plants:');
            completeCustomerData.units.forEach((unit, idx) => {
                console.log(`Unit ${idx + 1}: ${unit.unit_name} - ${unit.plants?.length || 0} plants`, unit.plants);
            });
        }
    }, [isCompleteCustomerModalOpen, completeCustomerData, editingCustomer]);

    // Certificate Functions
    const handleCertificateChange = (unitIndex, certIndex, field, value, file = null) => {
        console.log('Certificate change:', unitIndex, certIndex, field, value, file);

        setCompleteCustomerData(prev => ({
            ...prev,
            units: prev.units.map((unit, uIdx) => {
                if (uIdx !== unitIndex) return unit;

                return {
                    ...unit,
                    certificates: (unit.certificates || []).map((cert, cIdx) => {
                        if (cIdx !== certIndex) return cert;

                        if (field === 'file') {
                            return { ...cert, file: file, file_name: file ? file.name : null };
                        } else {
                            return { ...cert, [field]: value };
                        }
                    })
                };
            })
        }));
    };

    const addCertificate = (unitIndex) => {
        console.log('addCertificate called for unit:', unitIndex);

        setCompleteCustomerData(prev => {
            const updated = {
                ...prev,
                units: prev.units.map((unit, idx) => {
                    if (idx !== unitIndex) return unit;

                    return {
                        ...unit,
                        certificates: [
                            ...(unit.certificates || []),
                            {
                                Type: '',
                                validity_date: '',
                                certificat_id: null,
                                custom_type: '',
                                file: null,
                                file_url: null,
                                file_name: null
                            }
                        ]
                    };
                })
            };

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

    // Plant Functions (Separate Table)
    const handlePlantChange = (unitIndex, plantIndex, field, value, file = null) => {
        console.log('🔧 handlePlantChange called:', {
            unitIndex,
            plantIndex,
            field,
            value,
            file: file ? `File: ${file.name}` : 'null'
        });

        setCompleteCustomerData(prev => {
            // ⚠️ DON'T use JSON.parse(JSON.stringify()) - it destroys File objects!
            // Instead, manually clone the structure
            const updated = {
                ...prev,
                units: prev.units.map((unit, uIdx) => {
                    if (uIdx !== unitIndex) return unit;

                    return {
                        ...unit,
                        plants: (unit.plants || []).map((plant, pIdx) => {
                            if (pIdx !== plantIndex) return plant;

                            // This is the plant we're updating
                            if (field === 'fichier_accord' && file) {
                                console.log('✅ Setting fichier_accord file:', {
                                    name: file.name,
                                    size: file.size,
                                    type: file.type
                                });

                                return {
                                    ...plant,
                                    fichier_accord: file, // Store the actual File object
                                    file_name: file.name
                                };
                            } else if (field === 'fichier_accord' && !file) {
                                // Clear the file
                                return {
                                    ...plant,
                                    fichier_accord: null,
                                    file_name: null,
                                    fichier_accord_url: null
                                };
                            } else {
                                // Handle other fields
                                const dbFieldName = field === 'place_of_incoterms' ? 'place_of_incoterms' : field;
                                return {
                                    ...plant,
                                    [dbFieldName]: value
                                };
                            }
                        })
                    };
                })
            };

            console.log('✅ State updated. Plant now has file:',
                updated.units[unitIndex]?.plants[plantIndex]?.fichier_accord instanceof File
            );

            return updated;
        });
    };
    const addPlant = (unitIndex) => {
        setCompleteCustomerData(prev => {
            // ⚠️ NEVER use JSON.parse(JSON.stringify()) - it destroys File objects!
            // Use spread operator instead
            const updated = {
                ...prev,
                units: prev.units.map((unit, idx) => {
                    if (idx !== unitIndex) return unit;

                    return {
                        ...unit,
                        plants: [
                            ...(unit.plants || []),
                            {
                                plant_id: null,
                                plant: '',
                                Acheteur_avo: '',
                                alias: '',
                                top: '',
                                incoterms: '',
                                place_of_incoterms: '',
                                fichier_accord: null,
                                fichier_accord_url: null
                            }
                        ]
                    };
                })
            };

            return updated;
        });
    };

    const removePlant = (unitIndex, plantIndex) => {
        setCompleteCustomerData(prev => {
            const updated = { ...prev };
            updated.units[unitIndex] = {
                ...updated.units[unitIndex],
                plants: updated.units[unitIndex].plants.filter((_, i) => i !== plantIndex)
            };
            return updated;
        });
    };

    const openCompleteCustomerModal = () => {
        setEditingCustomer(null);
        setCompleteCustomerData({
            group: {
                supplier_name: '',
                responsible_group: '',
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
            responsible_group: group.responsible_group,
            description: group.description || ''
        });
        setFormErrors({});
        setIsGroupModalOpen(true);
    };




    const openEditCompleteCustomerModal = async (customer) => {
        try {
            setLoading(true);

            console.log('🔍 Opening edit modal for customer:', customer.supplier_name);

            // Fetch complete customer data
            const response = await fetch(`https://supplier-back.azurewebsites.net/ajouter/api/groups/${customer.supplier_id}/complete`);
            if (!response.ok) throw new Error('Failed to fetch customer details');

            const customerData = await response.json();

            // Fetch plants for each unit
            const unitsWithPlants = await Promise.all((customerData.units || []).map(async (unit) => {
                let unitPlants = [];
                try {
                    const plantsResponse = await fetch(`https://supplier-back.azurewebsites.net/ajouter/api/plants/by-unit/${unit.unit_id}`);
                    if (plantsResponse.ok) {
                        unitPlants = await plantsResponse.json();
                    }
                } catch (error) {
                    console.error(`Error fetching plants for unit ${unit.unit_id}:`, error);
                }

                return {
                    // Basic Information
                    unit_id: unit.unit_id,
                    unit_name: unit.unit_name || '',
                    city: unit.city || '',
                    country: unit.country || '',
                    com_person_id: unit.com_person_id || null,
                    zone_name: unit.zone_name || '',
                    document_file: unit.document_file || null,

                    plant: unit.plant || '',
                    top: unit.top || '',
                    status: unit.status || '',
                    category: unit.category || '',
                    responsible_text: unit.responsible || '',

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

                    // Plants from separate table
                    plants: unitPlants.map(plant => {
                        let file_url = null;
                        if (plant.fichier_accord) {
                            if (plant.fichier_accord.startsWith('http')) {
                                file_url = plant.fichier_accord;
                            } else if (plant.fichier_accord.startsWith('/uploads')) {
                                file_url = `https://supplier-back.azurewebsites.net${plant.fichier_accord}`;
                            }
                        }

                        return {
                            plant_id: plant.plant_id || null,
                            plant: plant.plant || '',
                            Acheteur_avo: plant.Acheteur_avo || '',
                            alias: plant.alias || '',
                            top: plant.top || '',
                            incoterms: plant.incoterms || '',
                            place_of_incoterms: plant.place_of_incoterms || '',
                            fichier_accord: null,
                            fichier_accord_url: file_url || null,
                            file_name: plant.fichier_accord ? plant.fichier_accord.split('/').pop() : null
                        };
                    }),

                    // Certificates
                    certificates: (unit.certificates || []).map(cert => ({
                        certificat_id: cert.certificat_id || null,
                        Type: cert.Type || '',
                        validity_date: cert.validity_date || '',
                        custom_type: cert.custom_type || '',
                        file: null,
                        file_url: cert.file ? (cert.file.startsWith('http') ? cert.file : `https://supplier-back.azurewebsites.net${cert.file}`) : cert.file_url || null,
                        file_name: cert.file ? cert.file.split('/').pop() : null
                    }))
                };
            }));

            setEditingCustomer(customerData);

            // Prepare the data to set
            const newCompleteCustomerData = {
                group: {
                    supplier_name: customerData.supplier_name,
                    responsible_group: customerData.responsible_group,
                    description: customerData.description || ''
                },
                units: unitsWithPlants
            };

            console.log('✅ CompleteCustomerData after mapping:', {
                units: newCompleteCustomerData.units?.length,
                plantsInFirstUnit: newCompleteCustomerData.units?.[0]?.plants?.length
            });

            // Set the state
            setCompleteCustomerData(newCompleteCustomerData);
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



    // Function to handle plant click
    // Function to handle plant click - show tree structure
    const handlePlantClick = (plant) => {
        setSelectedPlant(plant);
        setIsPlantModalOpen(true); // Still using the same modal state
    };

    // Function to close plant modal
    const closePlantModal = () => {
        setIsPlantModalOpen(false);
        setSelectedPlant(null);
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
                    document_file: null,
                    plant: '',
                    top: '',
                    status: '',
                    category: '',
                    responsible_text: '',

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

                    // Plants from separate table
                    plants: [
                        {
                            plant_id: null,
                            plant: '',
                            Acheteur_avo: '',
                            alias: '',
                            top: '',
                            incoterms: '',
                            place_of_incoterms: '',
                            fichier_accord: null,
                            fichier_accord_url: null
                        }
                    ],

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

            // Check plants - with null safety
            unit.plants?.forEach((plant, plantIndex) => {
                if (!plant?.plant?.trim()) {
                    errors[`plant_${unitIndex}_${plantIndex}_name`] = `Unit ${unitIndex + 1}, Plant ${plantIndex + 1} name is required`;
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

            toast.success(selectedGroup ? 'Customer updated successfully!' : 'Customer created successfully!');
            await fetchCustomers();
            closeModals();

        } catch (err) {
            setError(err.message);
            toast.error(`Error: ${err.message}`);
        }
    };

    // Helper function to handle plants data
    const handleUnitPlants = async (unit, unitId) => {
        try {
            console.log('\n🌱 ========== HANDLING PLANTS ==========');
            console.log('Unit:', unit.unit_name, '| Unit ID:', unitId);
            console.log('Total plants to process:', unit.plants?.length || 0);

            // LOG THE ENTIRE UNIT OBJECT
            console.log('📋 FULL UNIT OBJECT:', JSON.stringify(unit, (key, value) => {
                if (value instanceof File) {
                    return `File(${value.name}, ${value.size} bytes)`;
                }
                return value;
            }, 2));

            // Get existing plants for this unit
            const existingResponse = await fetch(`https://supplier-back.azurewebsites.net/ajouter/api/plants/by-unit/${unitId}`);
            const existingPlants = existingResponse.ok ? await existingResponse.json() : [];

            // Get current plant IDs from the form
            const currentPlantIds = unit.plants
                ? unit.plants.map(plant => plant.plant_id).filter(id => id)
                : [];

            // Find plants to delete (exist in DB but not in current form)
            const plantsToDelete = existingPlants.filter(plant =>
                !currentPlantIds.includes(plant.plant_id)
            );

            console.log('📊 Plants to delete:', plantsToDelete.length);

            // Delete plants that were removed
            const deletePromises = plantsToDelete.map(async (plant) => {
                console.log('🗑️  Deleting plant:', plant.plant_id);
                await fetch(`https://supplier-back.azurewebsites.net/ajouter/api/plants/${plant.plant_id}`, {
                    method: 'DELETE',
                });
            });

            // Handle plant updates/creations
            const updatePromises = (unit.plants || []).map(async (plant, index) => {
                console.log(`\n📤 ========== PROCESSING PLANT ${index + 1}/${unit.plants.length} ==========`);
                console.log('🔍 RAW PLANT OBJECT:', plant);
                console.log('Plant ID:', plant.plant_id || 'NEW');
                console.log('Plant Name:', plant.plant);

                // CHECK EVERY PROPERTY
                console.log('\n🔬 DETAILED FILE CHECK:');
                console.log('  plant.fichier_accord:', plant.fichier_accord);
                console.log('  typeof plant.fichier_accord:', typeof plant.fichier_accord);
                console.log('  plant.fichier_accord instanceof File:', plant.fichier_accord instanceof File);
                console.log('  plant.fichier_accord_url:', plant.fichier_accord_url);

                if (plant.fichier_accord) {
                    console.log('  fichier_accord properties:', {
                        name: plant.fichier_accord.name,
                        size: plant.fichier_accord.size,
                        type: plant.fichier_accord.type,
                        lastModified: plant.fichier_accord.lastModified
                    });
                }

                const formData = new FormData();
                formData.append('unit_id', unitId.toString());
                formData.append('plant', plant.plant || '');
                formData.append('Acheteur_avo', plant.Acheteur_avo || '');
                formData.append('alias', plant.alias || '');
                formData.append('top', plant.top || '');
                formData.append('incoterms', plant.incoterms || '');
                formData.append('place_of_incoterms', plant.place_of_incoterms || '');

                // Handle file logic
                console.log('\n📎 FILE APPEND LOGIC:');
                if (plant.fichier_accord && plant.fichier_accord instanceof File) {
                    console.log('✅ CONDITION MET: Appending file to FormData');
                    console.log('   File being appended:', plant.fichier_accord);
                    formData.append('fichier_accord', plant.fichier_accord);
                    formData.append('keepExistingFile', 'false');
                    console.log('   ✓ File appended successfully');
                } else if (plant.fichier_accord_url) {
                    console.log('🔗 CONDITION MET: Keeping existing file');
                    formData.append('keepExistingFile', 'true');
                } else {
                    console.log('📭 CONDITION MET: No file');
                    formData.append('keepExistingFile', 'false');
                }

                // Log FormData contents
                console.log('\n📦 FORMDATA CONTENTS:');
                let hasFile = false;
                for (let pair of formData.entries()) {
                    if (pair[1] instanceof File) {
                        console.log(`   ✓✓✓ ${pair[0]}: File(${pair[1].name}, ${pair[1].size} bytes, ${pair[1].type})`);
                        hasFile = true;
                    } else {
                        console.log(`   - ${pair[0]}: ${pair[1]}`);
                    }
                }

                if (!hasFile) {
                    console.error('❌❌❌ NO FILE IN FORMDATA! This is the problem!');
                }

                let response;
                let url;

                if (plant.plant_id) {
                    console.log(`\n🔄 Updating plant ${plant.plant_id}...`);
                    url = `https://supplier-back.azurewebsites.net/ajouter/api/plants/${plant.plant_id}`;
                    response = await fetch(url, {
                        method: 'PUT',
                        body: formData,
                    });
                } else {
                    console.log('\n➕ Creating new plant...');
                    url = 'https://supplier-back.azurewebsites.net/ajouter/api/plants';
                    response = await fetch(url, {
                        method: 'POST',
                        body: formData,
                    });
                }

                console.log('📡 Response:', response.status, response.statusText);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ REQUEST FAILED:', errorText);
                    throw new Error(`Failed to ${plant.plant_id ? 'update' : 'create'} plant`);
                }

                const result = await response.json();
                console.log('✅ Plant saved:');
                console.log('   fichier_accord in DB:', result.fichier_accord || 'NULL ❌');
                console.log('========== END PLANT ==========\n');

                return result;
            });

            await Promise.all([...deletePromises, ...updatePromises]);
            console.log('✅ ALL OPERATIONS COMPLETED\n');

        } catch (error) {
            console.error('❌ ERROR:', error);
            throw error;
        }
    };



    // Helper function to handle certificates data
    const handleUnitCertificates = async (unit, unitId) => {
        try {
            console.log('📁 Handling certificates for unit:', unit.unit_name, 'ID:', unitId);

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
                console.log('Deleting certificate:', cert.certificat_id);
                await fetch(`https://supplier-back.azurewebsites.net/ajouter/api/certificates/${cert.certificat_id}`, {
                    method: 'DELETE',
                });
            });

            // Handle certificate updates/creations
            const updatePromises = (unit.certificates || []).map(async (cert, index) => {
                const formData = new FormData();
                formData.append('unit_id', unitId.toString());
                formData.append('Type', cert.Type || cert.custom_type || '');
                formData.append('Date', cert.validity_date || cert.Date || '');
                formData.append('validity_date', cert.validity_date || cert.Date || '');

                if (cert.custom_type) {
                    formData.append('custom_type', cert.custom_type);
                }

                // Handle file upload
                if (cert.file && cert.file instanceof File) {
                    console.log('📤 Uploading file:', cert.file.name);
                    formData.append('file', cert.file);
                } else if (cert.file_url && !cert.file) {
                    formData.append('keepExistingFile', 'true');
                    console.log('🔗 Keeping existing file:', cert.file_url);
                }

                let response;
                let url;

                if (cert.certificat_id) {
                    // Update existing certificate
                    url = `https://supplier-back.azurewebsites.net/ajouter/api/certificates/${cert.certificat_id}`;
                    response = await fetch(url, {
                        method: 'PUT',
                        body: formData,
                    });
                } else {
                    // Create new certificate
                    url = 'https://supplier-back.azurewebsites.net/ajouter/api/certificates';
                    response = await fetch(url, {
                        method: 'POST',
                        body: formData,
                    });
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Certificate request failed:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorText,
                        url: url
                    });
                    throw new Error(`Failed to ${cert.certificat_id ? 'update' : 'create'} certificate`);
                }

                const result = await response.json();
                console.log('✅ Certificate saved:', result);
                return result;
            });

            // Wait for all operations to complete
            await Promise.all([...deletePromises, ...updatePromises]);
            console.log('✅ All certificate operations completed');

        } catch (error) {
            console.error('❌ Error handling certificates:', error);
            throw error;
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

                // 2. Update or create units
                const unitPromises = completeCustomerData.units.map(async (unit) => {
                    const unitData = {
                        supplier_id: editingCustomer.supplier_id,
                        unit_name: unit.unit_name,
                        city: unit.city || null,
                        country: unit.country || null,
                        com_person_id: unit.responsible?.Person_id || null,
                        zone_name: unit.zone_name || null,
                        document_file: unit.document_file || null,
                        plant: unit.plant || null,
                        top: unit.top || null,
                        status: unit.status || null,
                        category: unit.category || null,
                        responsible: unit.responsible_text || (typeof unit.responsible === 'string' ? unit.responsible : null),
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

                        // 3. Handle plants for this unit
                        await handleUnitPlants(unit, savedUnit.unit_id);

                        // 4. Handle certificates for this unit
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

                        // 3. Handle plants for this unit
                        await handleUnitPlants(unit, savedUnit.unit_id);

                        // 4. Handle certificates for this unit
                        await handleUnitCertificates(unit, savedUnit.unit_id);
                    }

                    return savedUnit;
                });

                // Wait for all units to be updated/created
                await Promise.all(unitPromises);
                toast.success('Customer updated successfully!');
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

                // 2. Then create each unit for this group
                const unitPromises = completeCustomerData.units.map(async (unit) => {
                    const unitData = {
                        supplier_id: groupId,
                        unit_name: unit.unit_name,
                        city: unit.city || null,
                        country: unit.country || null,
                        com_person_id: unit.responsible?.Person_id || null,
                        zone_name: unit.zone_name || null,
                        document_file: unit.document_file || null,
                        plant: unit.plant || null,
                        top: unit.top || null,
                        status: unit.status || null,
                        category: unit.category || null,
                        responsible: unit.responsible_text || (typeof unit.responsible === 'string' ? unit.responsible : null),
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

                    // 3. Handle plants for this unit
                    await handleUnitPlants(unit, savedUnit.unit_id);

                    // 4. Handle certificates for this unit
                    await handleUnitCertificates(unit, savedUnit.unit_id);

                    return savedUnit;
                });

                // Wait for all units to be created
                await Promise.all(unitPromises);

                toast.success("Customer created successfully!");
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

            toast.success('Supplier deleted successfully!');
            await fetchCustomers();
            closeModals();

        } catch (err) {
            setError(err.message);
            toast.error(`Error: ${err.message}`);
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
                            onPlantClick={handlePlantClick}  // Add this
                        />
                    ))}
                </div>

                {filteredCustomers.length === 0 && (
                    <div className="empty-state">
                        <i className="fas fa-inbox"></i>
                        <h3>No Suppliers Found</h3>
                        <p>No Suppliers match your search criteria.</p>
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
                    // Certificate functions
                    onAddCertificate={addCertificate}
                    onRemoveCertificate={removeCertificate}
                    onCertificateChange={handleCertificateChange}
                    // Plant functions (separate table)
                    onAddPlant={addPlant}
                    onRemovePlant={removePlant}
                    onPlantChange={handlePlantChange}
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
            {/* Plant Modal */}
            {/* Plant Modal - Now showing as Tree */}
            {isPlantModalOpen && selectedPlant && (
                <div className="modal-overlay" onClick={closePlantModal}>
                    <div className="modal-content plant-tree-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">
                                <i className="fas fa-project-diagram"></i>
                                <h2>Plant Tree Structure</h2>
                            </div>
                            <button className="modal-close" onClick={closePlantModal}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <PlantTree plant={selectedPlant} />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

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
    // Certificate props
    onAddCertificate,
    onRemoveCertificate,
    onCertificateChange,
    // Plant props (separate table)
    onAddPlant,
    onRemovePlant,
    onPlantChange
}) => {

    useEffect(() => {
        console.log('🔍 Modal data received:', data);
        data.units?.forEach((unit, idx) => {
            console.log(`Unit ${idx}: ${unit.unit_name || 'Unnamed'}`, {
                hasPlants: !!unit.plants,
                plantCount: unit.plants?.length || 0,
                hasCertificates: !!unit.certificates,
                certificateCount: unit.certificates?.length || 0
            });
        });
    }, [data]);

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
                                Supplier Name
                            </label>
                            <input
                                type="text"
                                id="group_name"
                                value={data.group.supplier_name}
                                onChange={(e) => onGroupChange('group.supplier_name', e.target.value)}
                                className={`form-input ${formErrors.group_name ? 'error' : ''}`}
                                placeholder="Enter supplier name"
                            />
                            {formErrors.group_name && (
                                <span className="error-message">{formErrors.group_name}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="group_name" className="form-label">
                                Responsible
                            </label>
                            <input
                                type="text"
                                id="responsible_group"
                                value={data.group.responsible_group}
                                onChange={(e) => onGroupChange('group.responsible_group', e.target.value)}
                                className={`form-input ${formErrors.responsible_group ? 'error' : ''}`}
                                placeholder="Enter supplier name"
                            />
                            {formErrors.responsible_group && (
                                <span className="error-message">{formErrors.responsible_group}</span>
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
                                placeholder="Enter supplier description"
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


                                {/* Plants to Deliver Section (Separate Table) */}
                                <div className="section-subheader">
                                    <div className="section-header">
                                        <h5 style={{
                                            borderLeft: '4px solid #6366f1',
                                            borderRadius: '12px',
                                            padding: '1.25rem 1.5rem',
                                            margin: '1.5rem 0',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            letterSpacing: '-0.025em',
                                            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.05), 0 2px 4px -1px rgba(99, 102, 241, 0.03)',
                                            backdropFilter: 'blur(10px)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            color: '#6366f1',
                                            fontSize: '22px',

                                        }}>
                                            <i className="fas fa-truck-loading" style={{
                                                color: '#6366f1',
                                                background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                                                width: '2.5rem',
                                                height: '2.5rem',
                                                borderRadius: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.125rem',
                                                boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2), 0 2px 4px -1px rgba(99, 102, 241, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.5)'
                                            }}></i>
                                            Plants to Deliver
                                            {unit.plants && unit.plants.length > 0 && (
                                                <span style={{
                                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                    color: 'white',
                                                    padding: '0.375rem 0.875rem',
                                                    borderRadius: '9999px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    marginLeft: 'auto',
                                                    boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.3), 0 2px 4px -1px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                                                }}>
                                                    {unit.plants.length}
                                                </span>
                                            )}
                                        </h5>
                                        <button
                                            type="button"
                                            className="btn-primary btn-sm"
                                            onClick={() => onAddPlant(unitIndex)}
                                        >
                                            <i className="fas fa-plus"></i> Add Plant
                                        </button>
                                    </div>
                                </div>

                                {(!unit.plants || unit.plants.length === 0) && (
                                    <div className="empty-plants-state">
                                        <div className="empty-plants-icon">
                                            <i className="fas fa-industry"></i>
                                        </div>
                                        <h4>No Plants Added Yet</h4>
                                        <p>Add plants that this unit will deliver to (stored in separate table)</p>
                                    </div>
                                )}

                                {unit.plants && unit.plants.map((plant, plantIndex) => (
                                    <div key={plantIndex} className="plant-section">
                                        <div className="plant-header">
                                            <h6>
                                                <i className="fas fa-industry"></i>
                                                Plant {plantIndex + 1}

                                            </h6>
                                            <button
                                                type="button"
                                                className="btn-icon btn-delete"
                                                onClick={() => onRemovePlant(unitIndex, plantIndex)}
                                                title="Remove Plant"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor={`plant_name_${unitIndex}_${plantIndex}`} className="form-label">
                                                    Plant Name
                                                </label>
                                                <select
                                                    id={`plant_name_${unitIndex}_${plantIndex}`}
                                                    value={plant.plant || ''}
                                                    onChange={(e) => onPlantChange(unitIndex, plantIndex, 'plant', e.target.value)}
                                                    className={`form-input ${formErrors[`plant_${unitIndex}_${plantIndex}_name`] ? 'error' : ''}`}
                                                >
                                                    <option value="">Select plant</option>
                                                    <option value="Sceet">Sceet</option>
                                                    <option value="Same">Same</option>
                                                    <option value="Kunshan">Kunshan</option>
                                                    <option value="Anhui">Anhui</option>
                                                    <option value="Tianjin">Tianjin</option>
                                                    <option value="Monterrey">Monterrey</option>
                                                    <option value="India">India</option>
                                                    <option value="Poitiers">Poitiers</option>
                                                    <option value="Cyclam">Cyclam</option>
                                                    <option value="Frankfurt">Frankfurt</option>
                                                    <option value="Korea">Korea</option>
                                                </select>
                                                {formErrors[`plant_${unitIndex}_${plantIndex}_name`] && (
                                                    <span className="error-message">{formErrors[`plant_${unitIndex}_${plantIndex}_name`]}</span>
                                                )}
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor={`acheteur_avo_${unitIndex}_${plantIndex}`} className="form-label">
                                                    Acheteur AVO
                                                </label>
                                                <input
                                                    type="text"
                                                    id={`acheteur_avo_${unitIndex}_${plantIndex}`}
                                                    value={plant.Acheteur_avo || ''}
                                                    onChange={(e) => onPlantChange(unitIndex, plantIndex, 'Acheteur_avo', e.target.value)}
                                                    className="form-input"
                                                    placeholder="Enter acheteur AVO"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor={`alias_${unitIndex}_${plantIndex}`} className="form-label">
                                                    Alias
                                                </label>
                                                <input
                                                    type="text"
                                                    id={`alias_${unitIndex}_${plantIndex}`}
                                                    value={plant.alias || ''}
                                                    onChange={(e) => onPlantChange(unitIndex, plantIndex, 'alias', e.target.value)}
                                                    className="form-input"
                                                    placeholder="Enter alias"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor={`plant_top_${unitIndex}_${plantIndex}`} className="form-label">
                                                    TOP
                                                </label>
                                                <input
                                                    type="text"
                                                    id={`plant_top_${unitIndex}_${plantIndex}`}
                                                    value={plant.top || ''}
                                                    onChange={(e) => onPlantChange(unitIndex, plantIndex, 'top', e.target.value)}
                                                    className="form-input"
                                                    placeholder="Enter TOP"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor={`incoterms_${unitIndex}_${plantIndex}`} className="form-label">
                                                    Incoterms
                                                </label>
                                                <select
                                                    id={`incoterms_${unitIndex}_${plantIndex}`}
                                                    value={plant.incoterms || ''}
                                                    onChange={(e) => onPlantChange(unitIndex, plantIndex, 'incoterms', e.target.value)}
                                                    className="form-input"
                                                >
                                                    <option value="">Select incoterms</option>
                                                    <option value="cashinadvance">Cash in advance</option>
                                                    <option value="15daysnet">15 days net</option>
                                                    <option value="30daysnet">30 days net</option>
                                                    <option value="15endofthemonth">15 end of the month or +</option>
                                                    <option value="30endofthemonth">30 end of the month or +</option>
                                                    <option value="30endofthemonth">60 end of the month or +</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor={`place_of_incoterms_${unitIndex}_${plantIndex}`} className="form-label">
                                                    Place of Incoterms
                                                </label>
                                                <input
                                                    type="text"
                                                    id={`place_of_incoterms_${unitIndex}_${plantIndex}`}
                                                    value={plant.place_of_incoterms || ''}
                                                    onChange={(e) => onPlantChange(unitIndex, plantIndex, 'place_of_incoterms', e.target.value)}
                                                    className="form-input"
                                                    placeholder="Enter place of incoterms"
                                                />
                                            </div>
                                        </div>

                                        {/* File Upload for Fichier d'Accord */}
                                        <div className="form-group">
                                            <label htmlFor={`fichier_accord_${unitIndex}_${plantIndex}`} className="form-label">
                                                Fichier d'Accord
                                            </label>
                                            <div className="file-upload-container">
                                                <input
                                                    type="file"
                                                    id={`fichier_accord_${unitIndex}_${plantIndex}`}
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        console.log('📎 FILE SELECTED:', file);
                                                        console.log('   Name:', file?.name);
                                                        console.log('   Size:', file?.size);
                                                        console.log('   Type:', file?.type);

                                                        if (file) {
                                                            // Call with empty string as value, file as the file parameter
                                                            onPlantChange(unitIndex, plantIndex, 'fichier_accord', '', file);
                                                        } else {
                                                            // No file selected
                                                            onPlantChange(unitIndex, plantIndex, 'fichier_accord', '', null);
                                                        }
                                                    }}
                                                    className="file-input"
                                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                />
                                                <div className="file-info">
                                                    {plant.fichier_accord ? (
                                                        <div className="file-preview">
                                                            <i className="fas fa-file"></i>
                                                            <span className="file-name">
                                                                {plant.fichier_accord.name || plant.file_name || 'Uploaded file'}
                                                            </span>
                                                            {plant.fichier_accord_url && (
                                                                <a
                                                                    href={plant.fichier_accord_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="file-preview-link"
                                                                >
                                                                    <i className="fas fa-eye"></i> Preview
                                                                </a>
                                                            )}
                                                            <button
                                                                type="button"
                                                                className="btn-icon btn-sm"
                                                                onClick={() => onPlantChange(unitIndex, plantIndex, 'fichier_accord', null, null)}
                                                                title="Remove file"
                                                            >
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="file-upload-placeholder">
                                                            <i className="fas fa-cloud-upload-alt"></i>
                                                            <span>Click to upload fichier d'accord (PDF, JPG, PNG, DOC)</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <small className="file-hint">Max file size: 10MB. Supported formats: PDF, JPG, PNG, DOC</small>
                                        </div>
                                    </div>
                                ))}

                                {/* Certificates Section */}
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

                                    {(!unit.certificates || unit.certificates.length === 0) && (
                                        <div className="empty-certificates-state">
                                            <div className="empty-certificates-icon">
                                                <i className="fas fa-certificate"></i>
                                            </div>
                                            <h4>No Certificates Added Yet</h4>
                                            <p>Add certificates for this unit (e.g., ISO standards, compliance certificates)</p>
                                        </div>
                                    )}

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

                                            {/* File Upload Section */}
                                            <div className="form-group">
                                                <label htmlFor={`cert_file_${unitIndex}_${certIndex}`} className="form-label">
                                                    Certificate File
                                                </label>
                                                <div className="file-upload-container">
                                                    <input
                                                        type="file"
                                                        id={`cert_file_${unitIndex}_${certIndex}`}
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                onCertificateChange(unitIndex, certIndex, 'file', null, file);
                                                            }
                                                        }}
                                                        className="file-input"
                                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                    />
                                                    <div className="file-info">
                                                        {cert.file ? (
                                                            <div className="file-preview">
                                                                <i className="fas fa-file"></i>
                                                                <span className="file-name">
                                                                    {cert.file.name || cert.file_name || 'Uploaded file'}
                                                                </span>
                                                                {cert.file_url && (
                                                                    <a
                                                                        href={cert.file_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="file-preview-link"
                                                                    >
                                                                        <i className="fas fa-eye"></i> Preview
                                                                    </a>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    className="btn-icon btn-sm"
                                                                    onClick={() => onCertificateChange(unitIndex, certIndex, 'file', null, null)}
                                                                    title="Remove file"
                                                                >
                                                                    <i className="fas fa-times"></i>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="file-upload-placeholder">
                                                                <i className="fas fa-cloud-upload-alt"></i>
                                                                <span>Click to upload certificate file (PDF, JPG, PNG, DOC)</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <small className="file-hint">Max file size: 10MB. Supported formats: PDF, JPG, PNG, DOC</small>
                                            </div>
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
const CustomerCard = ({ customer, onUnitClick, onEditGroupClick, onEditCompleteClick, onDeleteClick, onPlantClick }) => {
    const fallbackCategory = customer.description?.toLowerCase().includes('automobile') ? 'automobile' : 'industry';
    const { clearbitUrl, googleFaviconUrl, genericFallback } = getCompanyLogo(customer.supplier_name, customer.responsible_group, fallbackCategory);

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
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr', // Two equal columns
                        gap: '1rem',
                        marginTop: '0.75rem',
                        flexWrap: 'wrap' // Wraps to next line on smaller screens
                    }}>
                        {customer.responsible_group && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                borderRadius: '8px',
                                borderLeft: '3px solid #6366f1'
                            }}>
                                <i className="fas fa-user-tie" style={{
                                    color: '#ffffff',
                                    fontSize: '0.9rem'
                                }}></i>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.875rem',
                                    color: '#ffffff',
                                    fontWeight: '500'
                                }}>
                                    {customer.responsible_group}
                                </p>
                            </div>
                        )}

                        {customer.description && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                backgroundColor: 'rgba(156, 163, 175, 0.1)',
                                borderRadius: '8px',
                                borderLeft: '3px solid #9ca3af'
                            }}>
                                <i className="fas fa-info-circle" style={{
                                    color: '#ffffff',
                                    fontSize: '0.9rem',
                                    marginTop: '0.15rem'
                                }}></i>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.875rem',
                                    color: '#ffffff',
                                    lineHeight: '1.5'
                                }}>
                                    {customer.description}
                                </p>
                            </div>
                        )}
                    </div>

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
                                supplierName={customer.supplier_name} // Add this line
                                onClick={() => onUnitClick(unit.unit_id)}
                                onPlantClick={onPlantClick}  // Pass the plant click handler
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
                        <label htmlFor="responsible_group" className="form-label">
                            Responsible
                        </label>
                        <input
                            type="text"
                            id="responsible_group"
                            name="responsible_group"
                            value={formData.responsible_group}
                            onChange={onInputChange}
                            className={`form-input ${formErrors.responsible_group ? 'error' : ''}`}
                            placeholder="Enter Responsible"
                        />
                        {formErrors.responsible_group && (
                            <span className="error-message">{formErrors.responsible_group}</span>
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

// Add this helper function near the top of your file (after imports)
const getSupplierNameFromUnit = (unit, customers) => {
    if (!unit || !customers) return '';
    
    // If unit already has supplier_name (from API), use it
    if (unit.supplier_name) return unit.supplier_name;
    
    // Otherwise, find the supplier by supplier_id
    const customer = customers.find(c => c.supplier_id === unit.supplier_id);
    return customer ? customer.supplier_name : '';
};


// Unit Item Component with View Button
// Update the UnitItem component
const UnitItem = ({ unit,supplierName, onClick, onPlantClick }) => {
    const [showPlants, setShowPlants] = useState(false);

    const handleUnitClick = (e) => {
        if (!e.target.closest('.unit-view-btn') && !e.target.closest('.plant-clickable')) {
            setShowPlants(!showPlants);
        }
    };

    const handleViewClick = (e) => {
        e.stopPropagation();
        onClick();
    };

    const handlePlantClick = (e, plant) => {
        e.stopPropagation();
        e.preventDefault();
        onPlantClick(plant);
    };

    const getPlantType = (plantName) => {
        const plantNameLower = plantName?.toLowerCase() || '';
        if (plantNameLower.includes('sceet') || plantNameLower.includes('same') ||
            plantNameLower.includes('anhui') || plantNameLower.includes('india') ||
            plantNameLower.includes('korea')) {
            return 'Manufacturing';
        } else if (plantNameLower.includes('monterrey')) {
            return 'Assembly';
        } else if (plantNameLower.includes('kunshan') || plantNameLower.includes('tianjin')) {
            return 'Production';
        } else if (plantNameLower.includes('poitiers')) {
            return 'R&D';
        } else if (plantNameLower.includes('cyclam')) {
            return 'Development';
        } else if (plantNameLower.includes('frankfurt')) {
            return 'Sales';
        } else {
            return 'Manufacturing';
        }
    };

    const formatPlantName = (plantName) => {
        if (!plantName) return '';
        return plantName.charAt(0).toUpperCase() + plantName.slice(1);
    };

    return (
        <div className="unit-item-container">
            <div className={`unit-item ${showPlants ? 'expanded' : ''}`} onClick={handleUnitClick}>
                <div className="unit-info">
                    <div className="unit-name">
                        <i className="fas fa-factory"></i>
                        {unit.unit_name}
                        {unit.certificates && unit.certificates.length > 0 && (
                            <span className="certificate-count-badge">
                                <i className="fas fa-certificate"></i>
                                {unit.certificates.length}
                            </span>
                        )}
                        {/* Plants to deliver badge - using unit.plants array */}
                        {unit.plants && unit.plants.length > 0 && (
                            <span className="mainplants-count-badge">
                                <i className="fas fa-industry"></i>
                                {unit.plants.length}
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
                        {/* Show first plant as preview */}
                        {unit.plants && unit.plants.length > 0 && !showPlants && (
                            <span className="unit-plants-preview">
                                <i className="fas fa-industry"></i>
                                {unit.plants.slice(0, 2).map(p => p.plant).join(', ')}
                                {unit.plants.length > 2 && ` +${unit.plants.length - 2}`}
                            </span>
                        )}
                    </div>
                </div>
                <div className="unit-actions">
                    <button
                        className="unit-view-btn"
                        onClick={handleViewClick}
                        title="View Unit Details"
                    >
                        <i className="fas fa-eye"></i>
                    </button>
                    <div className="unit-arrow">
                        <i className={`fas fa-chevron-${showPlants ? 'down' : 'right'}`}></i>
                    </div>
                </div>
            </div>

            {/* Plants to deliver Tree Structure - using unit.plants array */}
      
    {showPlants && unit.plants && unit.plants.length > 0 && (
        <div className="plants-tree-container">
            <div className="plants-tree">
                {/* Update the tree-header to include supplier name */}
                <div className="tree-header">
                    <i className="fas fa-industry"></i>
                    <div className="tree-header-content">
                        <div className="tree-title-section">
                            <h5>Plants to deliver</h5>
                            
                        </div>
                       
                    </div>
                </div>
                
                {/* Rest of your existing tree structure remains the same */}
                <div className="tree-branches">
                    <div className="tree-trunk"></div>
                    <div className="tree-leaves">
                        {unit.plants.map((plant, index) => {
                            const formattedPlantName = formatPlantName(plant.plant);
                            const plantType = getPlantType(plant.plant);
                            const hasAlias = plant.alias && plant.alias.trim() !== '';

                            return (
                                <div
                                    key={`${plant.plant_id || index}`}
                                    className="tree-leaf plant-clickable"
                                    onClick={(e) => handlePlantClick(e, plant)}
                                >
                                    <div className="leaf-dot">
                                        <i className="fas fa-industry"></i>
                                    </div>
                                    <div className="leaf-text">
                                        <span className="plant-name">{supplierName} {formattedPlantName} </span>
                                     
                                        
                                        {/* Show additional plant info if available */}
                                        {plant.Acheteur_avo && (
                                            <span className="plant-detail">
                                                <i className="fas fa-user"></i> {plant.Acheteur_avo}
                                            </span>
                                        )}

                                        {/* Show delivery status if available */}
                                        {plant.delivered !== undefined && (
                                            <span className={`plant-status ${plant.delivered ? 'delivered' : 'pending'}`}>
                                                {plant.delivered ? '✓ Delivered' : '⏱ Pending'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="leaf-connector"></div>
                                </div>
                            );
                        })}
                    </div>
                </div>

             
            </div>
        </div>
    )}

            {showPlants && (!unit.plants || unit.plants.length === 0) && (
                <div className="no-plants-message">
                    <i className="fas fa-industry"></i>
                    <div>
                        <h5>No Plants to deliver</h5>
                        <p>This unit has no plants configured for delivery.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
// Unit Modal Component
const UnitModal = ({ unit, onClose }) => {
    if (!unit) return null;

    // Helper function to get full file URL
    const getFileUrl = (fileUrl) => {
        if (!fileUrl) return null;

        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
            return fileUrl;
        }

        return `https://supplier-back.azurewebsites.net${fileUrl}`;
    };

    // Helper function to get file name
    const getFileName = (filePath) => {
        if (!filePath) return 'File';
        return filePath.split('/').pop();
    };

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
                    {/* Unit Information Section */}
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

                    {/* Plants to Deliver Section (Separate Table) */}
                    {unit.plants && unit.plants.length > 0 && (
                        <div className="detail-section">
                            <h3>
                                <i className="fas fa-truck-loading"></i> Plants to Deliver ({unit.plants.length})
                            </h3>
                            <div className="plants-grid">
                                {unit.plants.map((plant, index) => (
                                    <div key={index} className="plant-card">
                                        <div className="plant-header">
                                            <i className="fas fa-industry"></i>
                                            <span className="plant-name">{plant.plant}</span>
                                            {plant.alias && <span className="plant-alias">({plant.alias})</span>}

                                        </div>
                                        <div className="plant-details">
                                            <DetailItem label="Acheteur AVO" value={plant.Acheteur_avo} />
                                            <DetailItem label="TOP" value={plant.top} />
                                            <DetailItem label="Incoterms" value={plant.incoterms} />
                                            <DetailItem label="Place of Incoterms" value={plant.place_of_incoterms} />
                                            {plant.fichier_accord && (
                                                <div className="file-preview-container">
                                                    <a
                                                        href={getFileUrl(plant.fichier_accord)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="file-link"
                                                    >
                                                        <i className="fas fa-file-contract"></i> Fichier d'Accord
                                                    </a>
                                                    <span className="file-name">
                                                        {getFileName(plant.fichier_accord)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Account Information Section */}
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

                    {/* Company Information Section */}
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

                    {/* Address Information Section */}
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

                    </div>

                    {/* Agreements Section */}
                    <div className="detail-section">
                        <h3>
                            <i className="fas fa-file-contract"></i> Agreements
                        </h3>
                        <div className="detail-grid">
                            <DetailItem label="Confidentiality Agreement" value={unit.confidentiality_agreement ? 'Yes' : 'No'} />
                            <DetailItem label="Quality Agreement" value={unit.quality_agreement ? 'Yes' : 'No'} />
                            <DetailItem label="Logistics Agreement" value={unit.logistics_agreement ? 'Yes' : 'No'} />

                        </div>
                    </div>




                    {/* Responsible Person Section */}
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
                                            <span className={`role-badge ${unit.responsible.role?.toLowerCase()}`}>
                                                {unit.responsible.role}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="person-details">
                                    <DetailItem label="Job Title" value={unit.responsible.job_title} icon="fas fa-briefcase" />
                                    <DetailItem label="Email" value={unit.responsible.email} icon="fas fa-envelope" isEmail />
                                    <DetailItem label="Phone" value={unit.responsible.phone_number} icon="fas fa-phone" isPhone />
                                    <DetailItem label="Zone" value={unit.responsible.zone_name} icon="fas fa-map-marker-alt" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Certificates Section */}
                    {unit.certificates && unit.certificates.length > 0 && (
                        <div className="detail-section">
                            <h3>
                                <i className="fas fa-certificate"></i> Unit Certificates ({unit.certificates.length})
                            </h3>
                            <div className="certificates-grid">
                                {unit.certificates.map((cert) => {
                                    const fileUrl = cert.file_url;

                                    return (
                                        <div key={cert.certificat_id || cert.Type} className="certificate-card">
                                            <div className="certificate-header">
                                                <i className="fas fa-certificate certificate-icon"></i>
                                                <span className="certificate-type">{cert.Type}</span>
                                                {cert.certificat_id && (
                                                    <span className="cert-id-badge">ID: {cert.certificat_id}</span>
                                                )}
                                            </div>

                                            <div className="certificate-details">
                                                <DetailItem
                                                    label="Validity Date"
                                                    value={cert.validity_date}
                                                    icon="fas fa-calendar-alt"
                                                />

                                                {cert.custom_type && (
                                                    <DetailItem
                                                        label="Custom Type"
                                                        value={cert.custom_type}
                                                        icon="fas fa-tag"
                                                    />
                                                )}

                                                {fileUrl && (
                                                    <div className="certificate-file-preview">
                                                        <div className="file-preview-header">
                                                            <div className="detail-label">
                                                                <i className="fas fa-paperclip"></i> Certificate File
                                                            </div>
                                                        </div>

                                                        <div className="file-actions">
                                                            <a href={getFileUrl(cert.file_url)} target="_blank" rel="noopener noreferrer">
                                                                View
                                                            </a>

                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
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
