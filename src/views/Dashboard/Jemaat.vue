<template>
  <div class="master-data-page">
    <div class="header-section">
      <div class="title-group">
        <h1 class="page-title">Data Jemaat</h1>
        <p class="page-subtitle">Kelola database jemaat, identitas keluarga, dan data gerejawi</p>
      </div>
      <div class="header-actions">
        <div class="search-wrapper">
          <Search size="18" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cari jemaat (Nama, NIK, KK)..." 
            class="search-input"
            @input="debounceSearch"
            :disabled="saving"
          />
        </div>
        <button class="btn btn-primary" @click="openModal()" :disabled="saving">
          <Plus size="18" /> <span>Tambah Jemaat</span>
        </button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="card table-card shadow-lg">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Memuat data jemaat...</p>
      </div>
      <div v-else-if="data.length === 0" class="empty-state">
        <div class="empty-icon text-slate-300"><Search size="48" /></div>
        <p class="mt-4 font-medium text-slate-500">Tidak ada data jemaat ditemukan.</p>
      </div>
      <div v-else class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Identitas</th>
              <th>Status</th>
              <th>Wilayah & Kontak</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data" :key="item.id" class="row-hover">
              <td>
                <div class="member-info-cell">
                  <div class="table-photo-wrapper">
                    <img v-if="item.foto" :src="item.foto" class="table-photo" alt="Foto" />
                    <div v-else class="table-photo-placeholder">
                      <User size="14" class="text-slate-400" />
                    </div>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-bold text-slate-800">{{ item.nama_lengkap }}</span>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{{ item.nik }}</span>
                      <span class="text-[10px] uppercase font-bold text-indigo-500">{{ item.hubungan_keluarga }}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div class="flex flex-col gap-1">
                  <span class="text-xs font-semibold">{{ item.status_jemaat?.name || '-' }}</span>
                  <span :class="['status-pill', item.status_aktif ? 'active' : 'inactive']">
                    {{ item.status_aktif ? 'Aktif' : 'Non-Aktif' }}
                  </span>
                </div>
              </td>
              <td>
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2 text-xs text-slate-600">
                    <MapPin size="12" class="text-indigo-400" /> <span>{{ item.wilayah?.name || '-' }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs text-slate-600">
                    <Phone size="12" class="text-indigo-400" /> <span>{{ item.no_hp || '-' }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="actions-group">
                  <button class="action-btn history" @click="openHistoryModal(item)" title="History Pelayanan" :disabled="saving">
                    <History size="16" />
                  </button>
                  <button class="action-btn edit" @click="openModal(item)" title="Ubah" :disabled="saving">
                    <Edit2 size="16" />
                  </button>
                  <button class="action-btn delete" @click="confirmDelete(item)" title="Hapus" :disabled="saving">
                    <Trash2 size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination Footer -->
        <div class="pagination-footer">
          <div class="per-page-selector">
            <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">TAMPILKAN</span>
            <select v-model="pagination.per_page" @change="fetchData(1)" :disabled="saving">
              <option :value="10">10 data</option>
              <option :value="25">25 data</option>
              <option :value="50">50 data</option>
              <option :value="100">100 data</option>
            </select>
          </div>
          
          <div class="pagination-controls">
            <span class="page-info">
              <b>{{ pagination.from || 0 }}-{{ pagination.to || 0 }}</b> <span class="text-slate-400 mx-1">dari</span> <b>{{ pagination.total }}</b>
            </span>
            <div class="page-buttons">
              <button class="page-btn" :disabled="pagination.current_page === 1 || saving" @click="fetchData(pagination.current_page - 1)">
                <ChevronLeft size="18" />
              </button>
              <button class="page-btn" :disabled="pagination.current_page === pagination.last_page || saving" @click="fetchData(pagination.current_page + 1)">
                <ChevronRight size="18" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="!saving && closeModal()">
        <div class="modal-content extra-large">
          <div class="modal-header">
            <div class="header-icon">
              <UserPlus v-if="!editingId" size="24" />
              <UserCog v-else size="24" />
            </div>
            <div class="header-text">
              <h2>{{ editingId ? 'Update Data Jemaat' : 'Tambah Jemaat Baru' }}</h2>
              <p>{{ editingId ? 'Ubah informasi detail jemaat' : 'Lengkapi formulir di bawah untuk mendaftarkan jemaat baru' }}</p>
            </div>
            <button class="close-btn" @click="closeModal" :disabled="saving"><X size="20" /></button>
          </div>

          <!-- Loading Overlay -->
          <div v-if="modalLoading" class="modal-loading-overlay">
            <div class="loading-content">
              <div class="spinner"></div>
              <p class="mt-4 text-slate-600 font-semibold">Memuat data jemaat...</p>
            </div>
          </div>

          <!-- Tabs Navigation -->
          <div class="modal-tabs">
            <button class="tab-btn" :class="{ active: activeTab === 'pribadi' }" @click="activeTab = 'pribadi'">
              <User size="16" /> Pribadi
            </button>
            <button class="tab-btn" :class="{ active: activeTab === 'keluarga' }" @click="activeTab = 'keluarga'">
              <Users size="16" /> Keluarga & Sosial
            </button>
            <button class="tab-btn" :class="{ active: activeTab === 'gerejawi' }" @click="activeTab = 'gerejawi'">
              <Church size="16" /> Gerejawi & Kontak
            </button>
            <button class="tab-btn" :class="{ active: activeTab === 'alamat' }" @click="activeTab = 'alamat'">
              <MapPin size="16" /> Alamat
            </button>
            <button class="tab-btn" :class="{ active: activeTab === 'lainnya' }" @click="activeTab = 'lainnya'">
              <MoreHorizontal size="16" /> Lainnya
            </button>
          </div>
          
          <form @submit.prevent="saveData" class="modal-body custom-scrollbar">
            <!-- TAB: Pribadi -->
            <div v-show="activeTab === 'pribadi'" class="tab-pane">
              <div class="photo-upload-section mb-8">
                <div class="photo-preview-container">
                  <div v-if="form.foto" class="photo-preview-wrapper">
                    <img :src="form.foto" alt="Preview Photo" class="photo-preview-image" />
                    <button type="button" class="remove-photo-btn" @click="removePhoto" title="Hapus Foto">
                      <X size="14" />
                    </button>
                  </div>
                  <div v-else class="photo-placeholder">
                    <Camera size="32" class="text-slate-300" />
                    <span class="text-[10px] uppercase font-bold text-slate-400 mt-2">Belum ada foto</span>
                  </div>
                </div>
                <div class="photo-upload-controls">
                  <label class="photo-upload-label">
                    <Upload size="16" />
                    <span>Unggah Foto Profil</span>
                    <input type="file" class="hidden" accept="image/*" @change="handlePhotoUpload" />
                  </label>
                  <p class="text-[10px] text-slate-400 mt-2">Maksimal 5MB. Format: JPG, PNG, WEBP.</p>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group span-2">
                  <label class="form-label">Nama Lengkap <span class="text-red-500">*</span></label>
                  <div class="input-wrapper">
                    <User size="18" class="input-icon" />
                    <input v-model="form.nama_lengkap" @input="toUppercase(form, 'nama_lengkap')" type="text" required placeholder="NAMA LENGKAP" :disabled="saving" />
                  </div>
                </div>

                <div class="form-group">
                  <div class="flex justify-between items-end mb-1">
                    <label class="form-label mb-0">NIK <span class="text-red-500">*</span></label>
                    <span :class="['text-[10px] font-bold', nikTouched && !isNikValid() ? 'text-red-500' : 'text-slate-400']">
                      {{ form.nik.length }}/16
                    </span>
                  </div>
                  <div :class="['input-wrapper', { 'error-ring': nikTouched && !isNikValid() }]">
                    <Hash size="18" class="input-icon" />
                    <input v-model="form.nik" @input="restrictNumeric(form, 'nik'); nikTouched = true" @blur="nikTouched = true" type="text" required placeholder="16 DIGIT NIK" :disabled="saving" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Nama Panggilan</label>
                  <div class="input-wrapper">
                    <Tag size="18" class="input-icon" />
                    <input v-model="form.nama_panggilan" @input="toUppercase(form, 'nama_panggilan')" type="text" placeholder="NAMA PANGGILAN" :disabled="saving" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Jenis Kelamin <span class="text-red-500">*</span></label>
                  <div class="input-wrapper">
                    <Users size="18" class="input-icon" />
                    <select v-model="form.jenis_kelamin" required :disabled="saving">
                      <option value="" disabled>Pilih</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Tempat Lahir <span class="text-red-500">*</span></label>
                  <div class="input-wrapper">
                    <MapPin size="18" class="input-icon" />
                    <input v-model="form.tempat_lahir" @input="toUppercase(form, 'tempat_lahir')" type="text" required placeholder="TEMPAT LAHIR" :disabled="saving" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Tanggal Lahir <span class="text-red-500">*</span></label>
                  <div class="input-wrapper">
                    <Calendar size="18" class="input-icon" />
                    <input v-model="form.tanggal_lahir" type="date" required :disabled="saving" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Golongan Darah</label>
                  <div class="input-wrapper">
                    <Droplet size="18" class="input-icon" />
                    <select v-model="form.golongan_darah" :disabled="saving">
                      <option value="">Pilih</option>
                      <option v-for="bg in bloodGroups" :key="bg" :value="bg">{{ bg }}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB: Keluarga & Sosial -->
            <div v-show="activeTab === 'keluarga'" class="tab-pane">
              <div class="form-grid">
                <div class="form-group span-2">
                  <div class="flex justify-between items-end mb-1">
                    <label class="form-label mb-0">No. KK <span class="text-red-500">*</span></label>
                    <span :class="['text-[10px] font-bold', kkTouched && !isKkValid() ? 'text-red-500' : 'text-slate-400']">
                      {{ form.no_kk.length }}/16
                    </span>
                  </div>
                  <div :class="['input-wrapper', { 'error-ring': kkTouched && !isKkValid() }]">
                    <Hash size="18" class="input-icon" />
                    <input v-model="form.no_kk" @input="restrictNumeric(form, 'no_kk'); kkTouched = true" @blur="kkTouched = true" type="text" required placeholder="16 DIGIT NO. KK" :disabled="saving" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Hubungan Keluarga <span class="text-red-500">*</span></label>
                  <div class="input-wrapper">
                    <Users size="18" class="input-icon" />
                    <select v-model="form.hubungan_keluarga" required :disabled="saving">
                      <option value="" disabled>Pilih</option>
                      <option value="Kepala Keluarga">Kepala Keluarga</option>
                      <option value="Istri">Istri</option>
                      <option value="Anak">Anak</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Status Pernikahan</label>
                  <div class="input-wrapper">
                    <Heart size="18" class="input-icon" />
                    <select v-model="form.status_pernikahan_id" :disabled="saving">
                      <option value="">Pilih</option>
                      <option v-for="s in masterData.maritalStatuses" :key="s.id" :value="s.id">{{ s.name }}</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Pendidikan</label>
                  <div class="input-wrapper">
                    <GraduationCap size="18" class="input-icon" />
                    <select v-model="form.pendidikan_id" :disabled="saving">
                      <option value="">Pilih</option>
                      <option v-for="e in masterData.educations" :key="e.id" :value="e.id">{{ e.name }}</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Pekerjaan</label>
                  <div class="input-wrapper">
                    <Briefcase size="18" class="input-icon" />
                    <select v-model="form.pekerjaan_id" :disabled="saving">
                      <option value="">Pilih</option>
                      <option v-for="o in masterData.occupations" :key="o.id" :value="o.id">{{ o.name }}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB: Gerejawi & Kontak -->
            <div v-show="activeTab === 'gerejawi'" class="tab-pane">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Status Jemaat</label>
                  <div class="input-wrapper">
                    <Info size="18" class="input-icon" />
                    <select v-model="form.status_jemaat_id" :disabled="saving">
                      <option value="">Pilih</option>
                      <option v-for="s in masterData.memberStatuses" :key="s.id" :value="s.id">{{ s.name }}</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Wilayah</label>
                  <div class="input-wrapper">
                    <Map size="18" class="input-icon" />
                    <select v-model="form.wilayah_id" :disabled="saving">
                      <option value="">Pilih</option>
                      <option v-for="w in masterData.churchAreas" :key="w.id" :value="w.id">{{ w.name }}</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Tanggal Terdaftar</label>
                  <div class="input-wrapper">
                    <CalendarCheck size="18" class="input-icon" />
                    <input v-model="form.tanggal_terdaftar" type="date" :disabled="saving" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">No. HP</label>
                  <div class="input-wrapper">
                    <Phone size="18" class="input-icon" />
                    <input v-model="form.no_hp" type="text" placeholder="0812..." :disabled="saving" />
                  </div>
                </div>

                <div class="form-group span-2">
                  <label class="form-label">Email</label>
                  <div class="input-wrapper">
                    <Mail size="18" class="input-icon" />
                    <input v-model="form.email" type="email" placeholder="example@mail.com" :disabled="saving" />
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB: Alamat -->
            <div v-show="activeTab === 'alamat'" class="tab-pane">
              <div class="address-management">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-sm font-bold text-slate-700">Daftar Alamat</h3>
                  <button type="button" class="btn btn-primary btn-sm" @click="addAddress" :disabled="saving">
                    <Plus size="14" /> Tambah Alamat
                  </button>
                </div>

                <div class="address-list flex flex-col">
                  <div v-for="(addr, index) in form.alamats" :key="index" class="address-item relative">
                    <div class="absolute top-4 left-6 flex items-center gap-2">
                       <span class="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-bold uppercase tracking-wider">Alamat #{{ index + 1 }}</span>
                    </div>
                    <button type="button" class="remove-address-btn" @click="removeAddress(index)" v-if="form.alamats.length > 1" title="Hapus Alamat">
                      <X size="14" />
                    </button>
                    
                    <div class="form-grid compact">
                      <div class="form-group span-2">
                        <label class="form-label text-xs">Caption Alamat (KTP, Domisili, dll)</label>
                        <input v-model="addr.caption_alamat" @input="toUppercase(addr, 'caption_alamat')" type="text" class="input-sm" required placeholder="CONTOH: KTP" :disabled="saving" />
                      </div>
                      <div class="form-group span-2">
                        <label class="form-label text-xs">Alamat Lengkap</label>
                        <input v-model="addr.alamat_lengkap" @input="toUppercase(addr, 'alamat_lengkap')" type="text" class="input-sm" required placeholder="JL. NAMA JALAN NO. 123" :disabled="saving" />
                      </div>

                      <div class="form-group searchable-select">
                        <label class="form-label text-xs">Provinsi</label>
                        <div class="input-wrapper" @click.stop="toggleRegionalDropdown('provinsi-' + index)">
                          <input v-model="addr.provinsi" class="input-sm cursor-pointer" readonly placeholder="Pilih Provinsi..." :disabled="saving" />
                          <ChevronDown size="14" class="absolute right-3 text-slate-400" />
                        </div>
                        <div v-if="regionalDropdowns.active === 'provinsi-' + index" class="select-dropdown">
                          <div class="search-box">
                            <Search size="14" class="search-icon" />
                            <input v-model="regionalDropdowns.search" class="input-sm" placeholder="Cari..." @click.stop focus autofocus />
                          </div>
                          <ul class="options-list custom-scrollbar">
                            <li v-for="p in filterRegions(masterData.provinces)" :key="p.id" @click="selectRegion(addr, 'provinsi', p)">
                              {{ p.name }}
                            </li>
                            <li v-if="filterRegions(masterData.provinces).length === 0" class="empty-option">Tidak ditemukan</li>
                          </ul>
                        </div>
                      </div>

                      <div class="form-group searchable-select">
                        <label class="form-label text-xs">Kota/Kabupaten</label>
                        <div class="input-wrapper" @click.stop="addr.provinsi && toggleRegionalDropdown('kota-' + index)">
                          <input v-model="addr.kota" class="input-sm cursor-pointer" readonly placeholder="Pilih Kota..." :disabled="!addr.provinsi || saving" />
                          <ChevronDown size="14" class="absolute right-3 text-slate-400" />
                        </div>
                        <div v-if="regionalDropdowns.active === 'kota-' + index" class="select-dropdown">
                          <div class="search-box">
                            <Search size="14" class="search-icon" />
                            <input v-model="regionalDropdowns.search" class="input-sm" placeholder="Cari..." @click.stop />
                          </div>
                          <ul class="options-list custom-scrollbar">
                            <li v-for="r in filterRegions(masterData.regencies[addr._province_id])" :key="r.id" @click="selectRegion(addr, 'kota', r)">
                              {{ r.name }}
                            </li>
                            <li v-if="filterRegions(masterData.regencies[addr._province_id]).length === 0" class="empty-option">Tidak ditemukan</li>
                          </ul>
                        </div>
                      </div>

                      <div class="form-group searchable-select">
                        <label class="form-label text-xs">Kecamatan</label>
                        <div class="input-wrapper" @click.stop="addr.kota && toggleRegionalDropdown('kecamatan-' + index)">
                          <input v-model="addr.kecamatan" class="input-sm cursor-pointer" readonly placeholder="Pilih Kecamatan..." :disabled="!addr.kota || saving" />
                          <ChevronDown size="14" class="absolute right-3 text-slate-400" />
                        </div>
                        <div v-if="regionalDropdowns.active === 'kecamatan-' + index" class="select-dropdown">
                          <div class="search-box">
                            <Search size="14" class="search-icon" />
                            <input v-model="regionalDropdowns.search" class="input-sm" placeholder="Cari..." @click.stop />
                          </div>
                          <ul class="options-list custom-scrollbar">
                            <li v-for="d in filterRegions(masterData.districts[addr._regency_id])" :key="d.id" @click="selectRegion(addr, 'kecamatan', d)">
                              {{ d.name }}
                            </li>
                            <li v-if="filterRegions(masterData.districts[addr._regency_id]).length === 0" class="empty-option">Tidak ditemukan</li>
                          </ul>
                        </div>
                      </div>

                      <div class="form-group searchable-select">
                        <label class="form-label text-xs">Kelurahan/Desa</label>
                        <div class="input-wrapper" @click.stop="addr.kecamatan && toggleRegionalDropdown('kelurahan-' + index)">
                          <input v-model="addr.kelurahan" class="input-sm cursor-pointer" readonly placeholder="Pilih Kelurahan..." :disabled="!addr.kecamatan || saving" />
                          <ChevronDown size="14" class="absolute right-3 text-slate-400" />
                        </div>
                        <div v-if="regionalDropdowns.active === 'kelurahan-' + index" class="select-dropdown">
                          <div class="search-box">
                            <Search size="14" class="search-icon" />
                            <input v-model="regionalDropdowns.search" class="input-sm" placeholder="Cari..." @click.stop />
                          </div>
                          <ul class="options-list custom-scrollbar">
                            <li v-for="v in filterRegions(masterData.villages[addr._district_id])" :key="v.id" @click="selectRegion(addr, 'kelurahan', v)">
                              {{ v.name }}
                            </li>
                            <li v-if="filterRegions(masterData.villages[addr._district_id]).length === 0" class="empty-option">Tidak ditemukan</li>
                          </ul>
                        </div>
                      </div>

                      <div class="form-group">
                        <label class="form-label text-xs">RT</label>
                        <input v-model="addr.rt" @input="restrictNumeric(addr, 'rt', 5)" type="text" class="input-sm" maxlength="5" placeholder="000" :disabled="saving" />
                      </div>
                      <div class="form-group">
                        <label class="form-label text-xs">RW</label>
                        <input v-model="addr.rw" @input="restrictNumeric(addr, 'rw', 5)" type="text" class="input-sm" maxlength="5" placeholder="000" :disabled="saving" />
                      </div>
                      <div class="form-group">
                        <label class="form-label text-xs">Kode Pos</label>
                        <input v-model="addr.kode_pos" @input="restrictNumeric(addr, 'kode_pos', 10)" type="text" class="input-sm" maxlength="10" placeholder="00000" :disabled="saving" />
                      </div>
                      <div class="form-group">
                        <label class="form-label text-xs">Negara</label>
                        <input v-model="addr.negara" @input="toUppercase(addr, 'negara')" type="text" class="input-sm" :disabled="saving" />
                      </div>
                      <div class="form-group span-4 flex items-center gap-2 mt-2">
                        <input :id="'utama-' + index" type="checkbox" v-model="addr.is_utama" @change="ensureOnePrimary(index)" :disabled="saving" />
                        <label :for="'utama-' + index" class="form-label mb-0" style="text-transform: none; cursor: pointer; font-size: 0.875rem;">Set sebagai Alamat Utama</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB: Lainnya -->
            <div v-show="activeTab === 'lainnya'" class="tab-pane">
              <div class="form-grid">
                <div class="form-group span-2">
                  <label class="form-label">Catatan / Keterangan</label>
                  <div class="input-wrapper">
                    <textarea v-model="form.keterangan" @input="toUppercase(form, 'keterangan')" rows="4" placeholder="INFORMASI TAMBAHAN JEMAAT..." :disabled="saving"></textarea>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Status Aktif</label>
                  <div class="status-toggle-group">
                    <button 
                      type="button" 
                      :class="['status-btn', { active: form.status_aktif }]"
                      @click="form.status_aktif = true"
                      :disabled="saving"
                    >Aktif</button>
                    <button 
                      type="button" 
                      :class="['status-btn', { active: !form.status_aktif }]"
                      @click="form.status_aktif = false"
                      :disabled="saving"
                    >Non-Aktif</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" @click="closeModal" :disabled="saving">Batal</button>
              <button type="submit" class="btn btn-primary btn-lg" :disabled="saving">
                <template v-if="saving">
                  <div class="spinner small"></div>
                  <span>Menyimpan...</span>
                </template>
                <template v-else>
                  <Check size="18" />
                  <span>{{ editingId ? 'Update Data' : 'Simpan Data' }}</span>
                </template>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- History Modal -->
    <Transition name="modal-fade">
      <div v-if="showHistoryModal" class="modal-overlay" @click.self="closeHistoryModal()">
        <div class="modal-content large">
          <div class="modal-header">
            <div class="header-icon">
              <History size="24" />
            </div>
            <div class="header-text">
              <h2>History Pelayanan: {{ selectedMemberName }}</h2>
              <p>Daftar semua permohonan layanan yang pernah diajukan</p>
            </div>
            <button class="close-btn" @click="closeHistoryModal"><X size="20" /></button>
          </div>
          
          <div class="modal-body history-body custom-scrollbar">
            <div v-if="historyLoading" class="loading-state py-8">
              <div class="spinner"></div>
              <p>Memuat history...</p>
            </div>
            <div v-else-if="serviceHistory.length === 0" class="empty-state py-8">
              <div class="empty-icon text-slate-300"><FileText size="48" /></div>
              <p class="mt-4 text-slate-500">Belum ada history pelayanan untuk jemaat ini.</p>
            </div>
            <div v-else class="history-list">
              <div v-for="h in serviceHistory" :key="h.id" class="history-card">
                <div class="history-main">
                  <div class="flex flex-col">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ h.request_number }}</span>
                    <span class="text-sm font-bold text-slate-800">{{ h.service_type?.name }}</span>
                  </div>
                  <div :class="['status-badge-mini', h.status]">
                    {{ h.status }}
                  </div>
                </div>
                <div class="history-meta mt-3">
                  <div class="flex items-center gap-4">
                    <div class="meta-item">
                      <Calendar size="12" class="text-indigo-400" />
                      <span>{{ formatDate(h.requested_at) }}</span>
                    </div>
                    <div class="meta-item" v-if="h.completed_at">
                      <CheckCircle size="12" class="text-green-500" />
                      <span>Selesai: {{ formatDate(h.completed_at) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="closeHistoryModal">Tutup</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from '../../axios';
import { useAuthStore } from '../../stores/auth';
import { 
  Plus, Edit2, Trash2, X, Search, Check, Hash, User, Users, Tag, 
  MapPin, Phone, Mail, Calendar, Droplet, Heart, 
  GraduationCap, Briefcase, Info, Map, CalendarCheck, MoreHorizontal,
  ChevronLeft, ChevronRight, UserPlus, UserCog, Camera, Upload, ChevronDown,
  History, FileText, CheckCircle
} from 'lucide-vue-next';
import Swal from 'sweetalert2';

const auth = useAuthStore();
const data = ref([]);
const loading = ref(true);
const saving = ref(false);
const showModal = ref(false);
const modalLoading = ref(false);
const editingId = ref(null);
const searchQuery = ref('');
const timer = ref(null);
const activeTab = ref('pribadi');
const showHistoryModal = ref(false);
const historyLoading = ref(false);
const serviceHistory = ref([]);
const selectedMemberName = ref('');

// Validation State for NIK & KK
const nikTouched = ref(false);
const kkTouched = ref(false);

const isNikValid = () => form.value.nik.length >= 10 && form.value.nik.length <= 16;
const isKkValid = () => form.value.no_kk.length >= 10 && form.value.no_kk.length <= 16;

// Searchable Regional Select State
const regionalDropdowns = ref({
  active: null, // 'provinsi-0', 'kota-0', etc.
  search: ''
});

const pagination = ref({ 
  current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 
});

const bloodGroups = ['A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const masterData = ref({
  maritalStatuses: [],
  educations: [],
  occupations: [],
  memberStatuses: [],
  churchAreas: [],
  provinces: [],
  regencies: {}, // { provinceId: [] }
  districts: {}, // { regencyId: [] }
  villages: {}   // { districtId: [] }
});

const defaultForm = () => ({
  nik: '',
  no_kk: '',
  nama_lengkap: '',
  nama_panggilan: '',
  jenis_kelamin: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  golongan_darah: '',
  hubungan_keluarga: '',
  status_pernikahan_id: '',
  pendidikan_id: '',
  pekerjaan_id: '',
  no_hp: '',
  email: '',
  status_jemaat_id: '',
  tanggal_terdaftar: '',
  wilayah_id: '',
  keterangan: '',
  status_aktif: true,
  foto: '',
  alamats: [
    {
      caption_alamat: 'KTP',
      alamat_lengkap: '',
      rt: '',
      rw: '',
      kelurahan: '',
      kecamatan: '',
      kota: '',
      provinsi: '',
      kode_pos: '',
      negara: 'Indonesia',
      is_utama: true,
      keterangan: ''
    }
  ]
});

const form = ref(defaultForm());

const fetchData = async (page = 1) => {
  loading.value = true;
  try {
    const res = await axios.get('/jemaat', {
      params: { 
        page, 
        per_page: pagination.value.per_page, 
        search: searchQuery.value 
      }
    });
    data.value = res.data.data;
    pagination.value = {
      current_page: res.data.current_page,
      last_page: res.data.last_page,
      per_page: res.data.per_page,
      total: res.data.total,
      from: res.data.from,
      to: res.data.to
    };
  } catch (error) {
    console.error('Fetch error:', error);
    Swal.fire('Error', 'Gagal memuat data jemaat', 'error');
  } finally {
    loading.value = false;
  }
};

const fetchMasterData = async () => {
  try {
    const [ms, ed, oc, ms2, ca] = await Promise.all([
      axios.get('/marital-statuses'),
      axios.get('/educations'),
      axios.get('/occupations'),
      axios.get('/member-statuses'),
      axios.get('/church-areas')
    ]);
    masterData.value = {
      maritalStatuses: ms.data.data || ms.data,
      educations: ed.data.data || ed.data,
      occupations: oc.data.data || oc.data,
      memberStatuses: ms2.data.data || ms2.data,
      churchAreas: ca.data.data || ca.data,
      provinces: [],
      regencies: {},
      districts: {},
      villages: {}
    };
    await fetchProvinces();
  } catch (e) {
    console.error('Master data error:', e);
  }
};

const fetchProvinces = async () => {
  if (masterData.value.provinces.length > 0) return;
  try {
    const res = await axios.get('/provinces');
    // Ensure we handle both direct array and {data: []} formats
    const rawData = res.data.data || res.data;
    masterData.value.provinces = Array.isArray(rawData) ? rawData : [];
  } catch (e) {
    console.error('Fetch provinces error:', e);
  }
};

const fetchRegencies = async (provinceId) => {
  if (!provinceId || masterData.value.regencies[provinceId]) return;
  try {
    const res = await axios.get(`/regencies/${provinceId}`);
    const rawData = res.data.data || res.data;
    masterData.value.regencies[provinceId] = Array.isArray(rawData) ? rawData : [];
  } catch (e) {
    console.error('Fetch regencies error:', e);
  }
};

const fetchDistricts = async (regencyId) => {
  if (!regencyId || masterData.value.districts[regencyId]) return;
  try {
    const res = await axios.get(`/districts/${regencyId}`);
    const rawData = res.data.data || res.data;
    masterData.value.districts[regencyId] = Array.isArray(rawData) ? rawData : [];
  } catch (e) {
    console.error('Fetch districts error:', e);
  }
};

const fetchVillages = async (districtId) => {
  if (!districtId || masterData.value.villages[districtId]) return;
  try {
    const res = await axios.get(`/villages/${districtId}`);
    const rawData = res.data.data || res.data;
    masterData.value.villages[districtId] = Array.isArray(rawData) ? rawData : [];
  } catch (e) {
    console.error('Fetch villages error:', e);
  }
};

const onProvinceChange = async (addr) => {
  // Reset dependents
  addr.kota = '';
  addr.kecamatan = '';
  addr.kelurahan = '';
  addr._regency_id = null;
  addr._district_id = null;
  
  const prov = masterData.value.provinces.find(p => p.name === addr.provinsi);
  if (prov) {
    addr._province_id = prov.id;
    await fetchRegencies(prov.id);
  } else {
    addr._province_id = null;
  }
};

const toggleRegionalDropdown = (id, currentVal) => {
  if (regionalDropdowns.value.active === id) {
    regionalDropdowns.value.active = null;
    regionalDropdowns.value.search = '';
  } else {
    regionalDropdowns.value.active = id;
    regionalDropdowns.value.search = ''; // Start fresh or keep current?
  }
};

const selectRegion = async (addr, type, item) => {
  if (type === 'provinsi') {
    addr.provinsi = item.name;
    await onProvinceChange(addr);
  } else if (type === 'kota') {
    addr.kota = item.name;
    await onRegencyChange(addr);
  } else if (type === 'kecamatan') {
    addr.kecamatan = item.name;
    await onDistrictChange(addr);
  } else if (type === 'kelurahan') {
    addr.kelurahan = item.name;
  }
  regionalDropdowns.value.active = null;
  regionalDropdowns.value.search = '';
};

const filterRegions = (list) => {
  if (!list) return [];
  if (!regionalDropdowns.value.search) return list.slice(0, 100); // Limit for performance
  const s = regionalDropdowns.value.search.toLowerCase();
  return list.filter(item => item.name.toLowerCase().includes(s)).slice(0, 100);
};

// --- VALIDATION HELPERS ---
const toUppercase = (obj, field) => {
  if (obj[field]) {
    obj[field] = obj[field].toUpperCase();
  }
};

const restrictNumeric = (obj, field, max = 16) => {
  // Only allow numbers
  let val = obj[field].replace(/\D/g, '');
  if (val.length > max) val = val.slice(0, max);
  obj[field] = val;
};

const handlePhotoUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    Swal.fire('Error', 'Ukuran foto maksimal 5MB', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      // Compression logic using Canvas
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400;
      const MAX_HEIGHT = 400;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      form.value.foto = canvas.toDataURL('image/jpeg', 0.7); // Compress to JPEG with 70% quality
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

const removePhoto = () => {
  form.value.foto = '';
};
// --------------------------

// Close dropdowns on click outside
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.searchable-select')) {
      regionalDropdowns.value.active = null;
    }
  });
}

const onRegencyChange = async (addr) => {
  addr.kecamatan = '';
  addr.kelurahan = '';
  const regs = masterData.value.regencies[addr._province_id] || [];
  const reg = regs.find(r => r.name === addr.kota);
  if (reg) {
    addr._regency_id = reg.id;
    await fetchDistricts(reg.id);
  } else {
    addr._regency_id = null;
  }
};

const onDistrictChange = async (addr) => {
  addr.kelurahan = '';
  const dists = masterData.value.districts[addr._regency_id] || [];
  const dist = dists.find(d => d.name === addr.kecamatan);
  if (dist) {
    addr._district_id = dist.id;
    await fetchVillages(dist.id);
  } else {
    addr._district_id = null;
  }
};

const openModal = async (item = null) => {
  activeTab.value = 'pribadi';
  showModal.value = true;
  
  if (item) {
    modalLoading.value = true;
    editingId.value = item.id;
    const cloned = JSON.parse(JSON.stringify(item));
    // Resolve regional IDs for editing if data exists
    if (cloned.alamats) {
      for (const addr of cloned.alamats) {
        if (addr.provinsi) {
          await fetchProvinces();
          const prov = masterData.value.provinces.find(p => p.name === addr.provinsi);
          if (prov) {
            addr._province_id = prov.id;
            await fetchRegencies(prov.id);
            if (addr.kota) {
              const reg = (masterData.value.regencies[prov.id] || []).find(r => r.name === addr.kota);
              if (reg) {
                addr._regency_id = reg.id;
                await fetchDistricts(reg.id);
                if (addr.kecamatan) {
                  const dist = (masterData.value.districts[reg.id] || []).find(d => d.name === addr.kecamatan);
                  if (dist) {
                    addr._district_id = dist.id;
                    await fetchVillages(dist.id);
                  }
                }
              }
            }
          }
        }
      }
    }

    form.value = {
      ...cloned,
      status_pernikahan_id: item.status_pernikahan_id || '',
      pendidikan_id: item.pendidikan_id || '',
      pekerjaan_id: item.pekerjaan_id || '',
      status_jemaat_id: item.status_jemaat_id || '',
      wilayah_id: item.wilayah_id || '',
      status_aktif: !!item.status_aktif
    };
  } else {
    editingId.value = null;
    form.value = defaultForm();
  }
  nikTouched.value = false;
  kkTouched.value = false;
  modalLoading.value = false;
};

const closeModal = () => {
  showModal.value = false;
};

const addAddress = () => {
  form.value.alamats.push({
    caption_alamat: '',
    alamat_lengkap: '',
    rt: '',
    rw: '',
    kelurahan: '',
    kecamatan: '',
    kota: '',
    provinsi: '',
    kode_pos: '',
    negara: 'Indonesia',
    is_utama: false,
    keterangan: ''
  });
};

const removeAddress = (index) => {
  if (form.value.alamats[index].is_utama && form.value.alamats.length > 1) {
    // move primary to first remaining
    const nextIdx = index === 0 ? 1 : 0;
    form.value.alamats[nextIdx].is_utama = true;
  }
  form.value.alamats.splice(index, 1);
};

const ensureOnePrimary = (index) => {
  if (form.value.alamats[index].is_utama) {
    form.value.alamats.forEach((a, i) => {
      if (i !== index) a.is_utama = false;
    });
  } else {
    // at least one must be primary
    const anyPrimary = form.value.alamats.some(a => a.is_utama);
    if (!anyPrimary) form.value.alamats[index].is_utama = true;
  }
};

const saveData = async () => {
  nikTouched.value = true;
  kkTouched.value = true;

  if (!isNikValid() || !isKkValid()) {
    Swal.fire({
      icon: 'error',
      title: 'Validasi Gagal',
      text: 'Pastikan NIK dan No. KK sudah benar (10-16 digit angka).',
      confirmButtonColor: '#6366f1'
    });
    return;
  }

  saving.value = true;
  try {
    if (editingId.value) {
      await axios.put(`/jemaat/${editingId.value}`, form.value);
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data jemaat telah diperbarui', timer: 2000, showConfirmButton: false });
    } else {
      await axios.post('/jemaat', form.value);
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data jemaat telah disimpan', timer: 2000, showConfirmButton: false });
    }
    fetchData(pagination.value.current_page);
    closeModal();
  } catch (error) {
    const msg = error.response?.data?.message || 'Gagal menyimpan data';
    const errors = error.response?.data?.errors;
    if (errors) {
       const firstErr = Object.values(errors)[0][0];
       Swal.fire('Error', firstErr, 'error');
    } else {
       Swal.fire('Error', msg, 'error');
    }
  } finally {
    saving.value = false;
  }
};

const openHistoryModal = async (item) => {
  selectedMemberName.value = item.nama_lengkap;
  showHistoryModal.value = true;
  historyLoading.value = true;
  try {
    const res = await axios.get('/service-requests', {
      params: { 
        member_id: item.id,
        status: 'completed', // Specificially requested completed history
        per_page: 50 
      }
    });
    serviceHistory.value = res.data.data;
  } catch (error) {
    console.error('History error:', error);
    Swal.fire('Error', 'Gagal memuat history pelayanan', 'error');
  } finally {
    historyLoading.value = false;
  }
};

const closeHistoryModal = () => {
  showHistoryModal.value = false;
  serviceHistory.value = [];
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

const confirmDelete = async (item) => {
  const res = await Swal.fire({
    title: 'Hapus Jemaat?',
    text: `Anda yakin ingin menghapus "${item.nama_lengkap}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Ya, Hapus'
  });
  if (res.isConfirmed) {
    try {
      await axios.delete(`/jemaat/${item.id}`);
      fetchData(pagination.value.current_page);
      Swal.fire('Berhasil', 'Data jemaat telah dihapus', 'success');
    } catch (e) {
      Swal.fire('Error', 'Gagal menghapus data', 'error');
    }
  }
};

onMounted(() => {
  fetchData();
  fetchMasterData();
});
</script>

<style scoped>
.master-data-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Section */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2.5rem;
  gap: 2rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.025em;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-wrapper {
  position: relative;
  width: 320px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 0.625rem 1rem 0.625rem 2.85rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.875rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 0.875rem;
  font-size: 0.875rem;
  font-weight: 700;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 0.625rem;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
}

.btn-ghost {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-ghost:hover:not(:disabled) {
  background: #f1f5f9;
  color: #1e293b;
  border-color: #cbd5e1;
}

.btn-lg {
  padding: 0.875rem 2rem;
  font-size: 1rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  border-radius: 0.625rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Table Section */
.card {
  background: white;
  border-radius: 1.25rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.modern-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.modern-table th {
  background: #f9fafb;
  padding: 1.125rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #4b5563;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
}

.modern-table td {
  padding: 1.25rem 1.5rem;
  font-size: 0.875rem;
  vertical-align: middle;
  border-bottom: 1px solid #f1f5f9;
}

.row-hover:hover {
  background-color: #f8fafc;
}

.status-pill {
  display: inline-block;
  padding: 0.125rem 0.625rem;
  border-radius: 2rem;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.status-pill.active { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.status-pill.inactive { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

.actions-group {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.625rem;
  border: 1px solid #e5e7eb;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.edit:hover { background: #f5f3ff; color: #6366f1; border-color: #c7d2fe; }
.action-btn.delete:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }
.action-btn.history:hover { background: #eff6ff; color: #3b82f6; border-color: #bfdbfe; }

/* History Styles */
.history-body {
  padding: 1.5rem 2rem;
  background: #f8fafc;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.25rem;
  transition: all 0.2s;
}

.history-card:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.history-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.status-badge-mini {
  padding: 0.25rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-badge-mini.completed { background: #f0fdf4; color: #166534; }
.status-badge-mini.pending { background: #fefce8; color: #854d0e; }

.history-meta {
  border-top: 1px solid #f1f5f9;
  padding-top: 0.75rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1.5rem;
}

.modal-content.extra-large {
  max-width: 1000px;
}

.modal-content {
  background: white;
  width: 100%;
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  padding: 1.75rem 2rem;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  position: relative;
}

.header-icon {
  width: 52px;
  height: 52px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.header-text h2 {
  font-size: 1.375rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.25rem;
  letter-spacing: -0.025em;
}

.header-text p {
  font-size: 0.9rem;
  color: #64748b;
}

.close-btn {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #475569;
}

/* Modal Loading Overlay */
.modal-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Tab Navigation */
.modal-tabs {
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  padding: 0 1.5rem;
  gap: 0.5rem;
}

.tab-btn {
  padding: 1.125rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #64748b;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  transition: all 0.2s;
}

.tab-btn:hover:not(.active) {
  color: #475569;
  background: #f1f5f9;
}

.tab-btn.active { color: #6366f1; }
.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #6366f1;
  border-radius: 3px 3px 0 0;
}

/* Modal Body */
.modal-body {
  padding: 2.25rem;
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.75rem;
}

.form-grid.compact {
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}

.span-2 { grid-column: span 2; }
.span-3 { grid-column: span 3; }
.span-4 { grid-column: span 4; }

.form-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 800;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.625rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1.125rem;
  color: #94a3b8;
}

.input-wrapper input, .input-wrapper select, .input-wrapper textarea, .input-sm {
  width: 100%;
  padding: 0.8125rem 1.125rem 0.8125rem 3rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 1rem;
  font-size: 0.95rem;
  transition: all 0.2s;
  color: #1e293b;
}

.input-sm {
  padding: 0.5rem 0.875rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
}

.input-wrapper input:focus, .input-wrapper select:focus, .input-wrapper textarea:focus, .input-sm:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.input-wrapper select {
  appearance: none;
  cursor: pointer;
}

.input-wrapper textarea {
  padding-left: 1.125rem;
  resize: vertical;
  min-height: 100px;
}

/* Address List Management */
.address-management {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.address-item {
  position: relative;
  padding: 1.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 1.25rem;
  transition: all 0.2s;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.address-item {
  position: relative;
  padding: 2.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
}

.address-item:hover {
  border-color: #6366f1;
  background: #fcfcff;
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.05);
  transform: translateY(-2px);
}

.remove-address-btn {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #94a3b8;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.remove-address-btn:hover {
  background: #fef2f2;
  color: #ef4444;
  border-color: #fecaca;
  transform: rotate(90deg);
}

/* Searchable Select */
.searchable-select {
  position: relative;
}

.cursor-pointer {
  cursor: pointer;
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  margin-top: 0.5rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideInDown 0.2s ease-out;
}

@keyframes slideInDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.search-box {
  padding: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  position: relative;
  background: #f8fafc;
}

.search-box .search-icon {
  position: absolute;
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-box input {
  width: 100%;
  padding-left: 2.5rem;
  background: white;
}

.options-list {
  max-height: 250px;
  overflow-y: auto;
  list-style: none;
  padding: 0.5rem 0;
  margin: 0;
}

.options-list li {
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.options-list li:hover {
  background: #f5f3ff;
  color: #6366f1;
  padding-left: 1.5rem;
}

.empty-option {
  padding: 1.5rem;
  text-align: center;
  color: #94a3b8;
  font-size: 0.875rem;
  font-style: italic;
}

/* Validation Styles */
.error-ring {
  border-color: #ef4444 !important;
  background: #fffafa !important;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1) !important;
}

.error-ring .input-icon {
  color: #ef4444 !important;
}

.error-ring input {
  color: #b91c1c !important;
}

/* Global Uppercase for Inputs */
input[type="text"]:not(.search-input), 
textarea {
  text-transform: uppercase;
}

input::placeholder,
textarea::placeholder {
  text-transform: none; /* Keep placeholders readable if needed, or uppercase them too */
}

.status-toggle-group {
  display: flex;
  background: #f1f5f9;
  padding: 0.375rem;
  border-radius: 0.875rem;
  gap: 0.375rem;
  width: max-content;
}

.status-btn {
  padding: 0.5rem 1.5rem;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748b;
  background: transparent;
}

.status-btn.active {
  background: white;
  color: #0f172a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.modal-footer {
  padding: 1.75rem 2.25rem;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 1.25rem;
  background: #f8fafc;
}

/* Pagination Section */
.pagination-footer {
  padding: 1.25rem 1.75rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.per-page-selector {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
}

.per-page-selector select {
  padding: 0.4rem 0.75rem;
  border-radius: 0.625rem;
  border: 1.5px solid #e2e8f0;
  font-size: 0.8rem;
  background: white;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.per-page-selector select:focus {
  border-color: #6366f1;
  outline: none;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1.75rem;
}

.page-info {
  font-size: 0.875rem;
  color: #64748b;
}

.page-buttons {
  display: flex;
  gap: 0.625rem;
}

.page-btn {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background: white;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #1e293b;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Spinner & Animations */
.loading-state, .empty-state {
  padding: 4rem 2rem;
  text-align: center;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #eef2ff;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.spinner.small {
  width: 1.25rem;
  height: 1.25rem;
  border-width: 2px;
  margin: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.tab-pane {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; background-clip: content-box; }

/* Table Photo Styles */
.member-info-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.table-photo-wrapper {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  overflow: hidden;
  background: #f1f5f9;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.table-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.table-photo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Photo Upload Section */
.photo-upload-section {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 1.25rem;
}

.photo-preview-container {
  width: 100px;
  height: 100px;
  border-radius: 1rem;
  background: #ffffff;
  border: 2px solid #ffffff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.photo-preview-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.photo-preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.remove-photo-btn {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s;
  z-index: 10;
}

.remove-photo-btn:hover {
  transform: scale(1.1);
  background: #dc2626;
}

.photo-upload-controls {
  display: flex;
  flex-direction: column;
}

.photo-upload-label {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.photo-upload-label:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: #f5f3ff;
}

.modal-content.extra-large {
  max-width: 1100px;
}
</style>
