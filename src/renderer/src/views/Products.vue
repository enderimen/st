<template>
  <el-card class="card-view box-card">
    <div class="card-header">
      <h1><i class="el-icon-refrigerator"></i> Ürün Çeşitleri({{ productList?.length }})</h1>
      <el-button type="primary" @click="isOpenDialog('add')" icon="el-icon-circle-plus">
        Yeni Ürün Çeşidi Oluştur
      </el-button>
    </div>

    <el-form label-position="top">
      <el-row type="flex" justify="start" align="center" :gutter="16">
        <el-col :span="5">
          <el-form-item label="Arama" class="custom-width">
            <el-input
              v-model="filter.search"
              placeholder="Ürün arayın"
              clearable
              @input="currentPage = 1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="5">
          <el-form-item label="Peynir Tipi" class="custom-width">
            <el-radio-group v-model="filter.unitWeight" size="small" @change="currentPage = 1">
              <el-radio :label="true">Sade</el-radio>
              <el-radio :label="false">Otlu</el-radio>
              <el-radio label="Tümü">Tümü</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-table border style="width: 100%" :data="paginatedData" empty-text="Ürün çeşidi bulunamadı">
      <el-table-column prop="category" sortable label="Kategori"></el-table-column>
      <el-table-column prop="name" sortable label="Ürün Adı"></el-table-column>
      <el-table-column prop="unitWeight" sortable label="Ürün Tipi"></el-table-column>
      <el-table-column prop="isGrass" sortable label="Otlu / Sade">
        <template v-slot="scope">
          <el-tag v-if="scope.row.isGrass" type="success" effect="dark" style="width: 50px"
            >Otlu</el-tag
          >
          <el-tag v-else effect="dark" style="width: 50px">Sade</el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="İşlem" width="112">
        <template v-slot="scope">
          <el-button
            type="primary"
            icon="el-icon-edit"
            circle
            @click="isOpenDialog('edit', scope.row)"
          ></el-button>
          <el-button
            type="danger"
            icon="el-icon-delete"
            circle
            @click="open(scope.row)"
          ></el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      background
      layout="prev, pager, next"
      :total="filteredData?.length"
      :page-size="pageSize"
      :current-page="currentPage"
      @current-change="handlePageChange"
      style="margin-top: 20px; text-align: center"
    />
    <el-dialog
      :title="editingProduct ? 'Ürün Çeşidini Düzenle' : 'Yeni Ürün Çeşidi Oluştur'"
      :visible.sync="dialogVisible"
      width="30%"
    >
      <el-form
        ref="productForm"
        label-position="top"
        :model="formData"
        label-width="100px"
        :rules="rules"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Ürün Adı" prop="name">
              <el-input v-model="formData.name" placeholder="Örneğin: Salamura, Tulum"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="KG Birimi" class="custom-width" prop="unitWeight">
              <el-input-number
                v-model="formData.unitWeight"
                :min="0"
                :step="1"
                :max="50"
              ></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Ürün Kategorisi" prop="category">
              <el-input v-model="formData.category" placeholder="Örneğin: Peynir"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="İçerik" prop="isGrass">
              <el-radio v-model="formData.isGrass" :label="true">Otlu</el-radio>
              <el-radio v-model="formData.isGrass" :label="false">Sade</el-radio>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">Vazgeç</el-button>
        <el-button type="primary" @click="saveProduct" :disabled="isSaveDisabled">Kaydet</el-button>
      </span>
    </el-dialog>
  </el-card>
</template>

<script>
import { supabase } from '../utils/supabase'
import globalMixin from '../mixin/global.mixin.js'

export default {
  name: 'Products',
  mixins: [globalMixin],
  data() {
    return {
      productList: [],
      products: [],
      dialogVisible: false,
      currentPage: 1,
      pageSize: 11,
      filter: {
        search: '',
        unitWeight: null
      },
      editingProduct: false,
      formData: {
        name: '',
        unitWeight: '',
        category: '',
        isGrass: null
      },
      rules: {
        name: [{ required: true, message: 'Ürün adı zorunlu', trigger: 'blur' }],
        unitWeight: [
          { required: true, type: 'number', message: 'Kg birimi girin', trigger: 'change' }
        ],
        category: [{ required: true, message: 'Kategori zorunlu', trigger: 'blur' }],
        isGrass: [{ required: true, message: 'İçerik seçin', trigger: 'change' }]
      },
      originalFormData: null,
      currentProductType: '',
      editingProduct: false
    }
  },
  async mounted() {
    console.log(this.currentTenantId)
    await this.getAllProductTypes()
  },
  computed: {
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredData?.slice(start, end)
    },
    filteredData() {
      const filtered = this.productList?.filter((item) => {
        const matchesSearch = this.filter.search
          ? item.name.toLowerCase().includes(this.filter?.search.toLowerCase())
          : true

        const matchesState =
          this.filter.unitWeight === 'Tümü' ||
          this.filter.unitWeight === null ||
          this.filter.unitWeight === undefined
            ? true
            : item.isGrass !== this.filter.unitWeight

        return matchesSearch && matchesState
      })

      return filtered
    },
    isSaveDisabled() {
      const { name, unitWeight, category, isGrass } = this.formData
      if (!name || !unitWeight || !category || isGrass === null) return true

      if (this.editingProduct) {
        return JSON.stringify(this.formData) === JSON.stringify(this.originalFormData)
      }

      return false
    }
  },
  methods: {
    async getAllProductTypes() {
      const { data, error } = await supabase
        .from('product_types')
        .select('*')
        .eq('tenant_id', this.currentTenantId)

      if (error) {
        console.error('Error fetching products:', error)
        this.$message.error('Ürünler yüklenirken bir hata oluştu.')
      } else {
        this.productList = data.map((item) => {
          const uWeight = item.unit_weight !== undefined ? item.unit_weight : item.unitWeight
          return {
            id: item.id,
            name: item.name,
            category: item.category,
            unitWeight: `${uWeight}KG`,
            isGrass: item.is_grassy !== undefined ? item.is_grassy : item.isGrass,
            tenant_id: item.tenant_id
          }
        })
      }
    },
    async addProduct(payload) {
      const { error } = await supabase.from('product_types').insert([
        {
          name: payload.name,
          category: payload.category,
          unit_weight: payload.unitWeight,
          is_grassy: payload.isGrass,
          tenant_id: this.currentTenantId
        }
      ])
      if (error) throw error
      await this.getAllProductTypes()
    },
    async updateProduct(payload) {
      const { error } = await supabase
        .from('product_types')
        .update({
          name: payload.name,
          category: payload.category,
          unit_weight: payload.unitWeight,
          is_grassy: payload.isGrass
        })
        .eq('id', payload.id)
      if (error) throw error
      await this.getAllProductTypes()
    },
    async deleteProduct(id) {
      const { error } = await supabase.from('product_types').delete().eq('id', id)
      if (error) throw error
      await this.getAllProductTypes()
    },
    handlePageChange(page) {
      this.currentPage = page
    },
    isOpenDialog(type, row) {
      this.editingProduct = type === 'edit'

      if (this.editingProduct && row) {
        const numericType = parseInt(String(row.unitWeight).replace('KG', ''), 10)

        this.formData = {
          id: row.id,
          name: row.name,
          unitWeight: numericType,
          category: row.category,
          isGrass: row.isGrass
        }
        this.originalFormData = JSON.parse(JSON.stringify(this.formData))
      } else {
        this.formData = { id: '', name: '', unitWeight: null, category: '', isGrass: null }
        this.originalFormData = null
      }
      this.dialogVisible = true
    },
    saveProduct() {
      this.$refs.productForm.validate(async (valid) => {
        if (!valid) return

        if (this.editingProduct) {
          try {
            await this.updateProduct(this.formData)
            /* var olan bir ürünle match olursa izin vermemeli */
            this.$notify({
              title: 'Başarılı',
              type: 'success',
              message: 'Ürün düzenlendi!',
              duration: 3000,
              position: 'top-right'
            })
          } catch (error) {
            this.$message.error('Ürün güncellenirken hata oluştu.')
            console.error(error)
          }
        } else {
          try {
            await this.addProduct(this.formData)

            this.$notify({
              title: 'Başarılı',
              type: 'success',
              message: 'Ürün oluşturuldu!',
              duration: 3000,
              position: 'top-right'
            })
          } catch (error) {
            this.$message.error('Ürün eklenirken hata oluştu.')
            console.error(error)
          }
        }

        this.dialogVisible = false
      })
    },
    open(row) {
      this.$confirm(
        `${row.name} ${row.category} - ${row.unitWeight} ürününü, silmek istediğinden emin misiniz?`,
        'Ürün Silme İşlemi',
        {
          distinguishCancelAndClose: true,
          confirmButtonText: 'Evet, Sil',
          cancelButtonText: 'İptal Et'
        }
      )
        .then(async () => {
          await this.deleteProduct(row.id)
          this.$notify({
            title: 'Başarılı',
            type: 'success',
            message: 'Ürün başarıyla silindi!',
            duration: 3000,
            position: 'top-right'
          })
        })
        .catch((action) => {
          this.$notify({
            title: 'Bilgi',
            type: 'info',
            message: 'İşlem iptal edildi',
            duration: 3000,
            position: 'top-right'
          })
        })
    }
  }
}
</script>