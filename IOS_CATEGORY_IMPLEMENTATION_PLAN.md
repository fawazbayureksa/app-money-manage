# iOS Swift Category Management Feature - Implementation Plan

## Project Overview

Create category management feature using Swift and UIKit/SwiftUI that allows users to view, create, and delete expense/income categories with API integration.

## Data Models

### Category Model

```swift
struct Category: Codable, Identifiable {
    let id: Int
    let categoryName: String
    let description: String
    let userId: Int
    let createdAt: Date
    let updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id = "ID"
        case categoryName = "CategoryName"
        case description = "Description"
        case userId = "UserID"
        case createdAt = "CreatedAt"
        case updatedAt = "UpdatedAt"
    }
}
```

### API Response Models

```swift
struct APIResponse<T: Codable>: Codable {
    let success: Bool
    let message: String?
    let data: T?
}

struct CategoryListResponse: Codable {
    let categories: [Category]
}

struct ErrorResponse: Codable {
    let success: Bool
    let message: String
}
```

## Network Layer Implementation

### API Client

1. **Create base APIClient class/protocol with:**
   - Base URL configuration
   - Request builder (headers, auth token injection)
   - Response handler with generic Decodable parsing
   - Error mapping (401, 404, 500, network errors)
   - Retry logic for failed requests
   - Request/response logging for debugging

```swift
protocol APIClientProtocol {
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T
}

class APIClient: APIClientProtocol {
    private let baseURL: String
    private let session: URLSession

    init(baseURL: String, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
        // Implementation
    }
}
```

2. **Category Service/Repository:**

```swift
protocol CategoryServiceProtocol {
    func getCategories() async throws -> [Category]
    func createCategory(name: String, description: String) async throws -> Category
    func deleteCategory(id: Int) async throws -> Bool
}

class CategoryService: CategoryServiceProtocol {
    private let apiClient: APIClientProtocol

    init(apiClient: APIClientProtocol) {
        self.apiClient = apiClient
    }

    func getCategories() async throws -> [Category] {
        let response: APIResponse<[Category]> = try await apiClient.request(.getCategories)
        guard let categories = response.data else {
            throw APIError.noData
        }
        return categories
    }

    func createCategory(name: String, description: String) async throws -> Category {
        // Implementation
    }

    func deleteCategory(id: Int) async throws -> Bool {
        // Implementation
    }
}
```

## UI Components & Screens

### CategoryListViewController/View (SwiftUI)

```swift
struct CategoryListView: View {
    @StateObject private var viewModel = CategoryListViewModel()

    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading {
                    ProgressView()
                } else if viewModel.categories.isEmpty {
                    EmptyStateView()
                } else {
                    CategoryList(categories: viewModel.categories)
                }

                // Floating Add Button
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        AddButton()
                    }
                }
            }
            .navigationTitle("Categories")
            .refreshable {
                await viewModel.fetchCategories()
            }
        }
    }
}
```

**Layout:**

- Navigation bar with title "Categories"
- List/TableView of categories (UITableView or SwiftUI List)
- Pull-to-refresh functionality
- Floating action button (+) for adding categories
- Empty state view when no categories exist

**Each Category Cell:**

- Category name (primary text, bold)
- Description (secondary text, gray)
- Delete button (trash icon, red) on the right
- Swipe-to-delete gesture support

### AddCategoryViewController/View

**Modal/Push presentation with:**

- Navigation bar with Cancel and Save buttons
- Form fields:
  - Category Name (text field, required)
  - Description (text field/area, optional)
- Form validation before submission
- Loading state during API call
- Error handling with alerts

```swift
struct AddCategoryView: View {
    @Environment(\.dismiss) var dismiss
    @StateObject private var viewModel = AddCategoryViewModel()
    @State private var categoryName = ""
    @State private var description = ""

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Category Details")) {
                    TextField("Category Name *", text: $categoryName)
                    TextField("Description", text: $description)
                }
            }
            .navigationTitle("Add Category")
            .navigationBarItems(
                leading: Button("Cancel") { dismiss() },
                trailing: Button("Save") {
                    Task {
                        await viewModel.createCategory(
                            name: categoryName,
                            description: description
                        )
                    }
                }
                .disabled(!viewModel.isValid)
            )
            .overlay {
                if viewModel.isLoading {
                    ProgressView()
                }
            }
        }
    }
}
```

## Feature Implementation Details

### 1. Category List Screen (ViewModel)

```swift
@MainActor
class CategoryListViewModel: ObservableObject {
    @Published var categories: [Category] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let categoryService: CategoryServiceProtocol

    init(categoryService: CategoryServiceProtocol = CategoryService()) {
        self.categoryService = categoryService
    }

    func fetchCategories() async {
        isLoading = true
        defer { isLoading = false }

        do {
            categories = try await categoryService.getCategories()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func deleteCategory(_ category: Category) async {
        do {
            let success = try await categoryService.deleteCategory(id: category.id)
            if success {
                categories.removeAll { $0.id == category.id }
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
```

**UI States to handle:**

- Loading: Show activity indicator
- Empty: Show empty state with illustration and CTA
- Error: Show error message with retry button
- Success: Display category list

### 2. Add Category Screen (ViewModel)

```swift
@MainActor
class AddCategoryViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var isValid = false

    private let categoryService: CategoryServiceProtocol

    init(categoryService: CategoryServiceProtocol = CategoryService()) {
        self.categoryService = categoryService
    }

    func validateForm(name: String, description: String) {
        isValid = !name.isEmpty && name.count >= 2
    }

    func createCategory(name: String, description: String) async -> Bool {
        guard isValid else { return false }

        isLoading = true
        defer { isLoading = false }

        do {
            _ = try await categoryService.createCategory(
                name: name,
                description: description
            )
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }
}
```

**Form validation:**

- Category name: Required, min 2 characters
- Description: Optional, max 200 characters
- Real-time validation feedback

**Submission flow:**

- Disable form during submission
- Show loading indicator on save button
- On success: Dismiss screen, show toast/alert, refresh list
- On error: Show error message, keep form data

### 3. Delete Category

**Flow:**

- Show confirmation alert with category name
- Two options: Cancel (default) / Delete (destructive)
- On confirm: Call delete API
- On success: Remove from list with animation, show success message
- On error: Show error alert, keep item in list

```swift
func showDeleteConfirmation(for category: Category) {
    let alert = UIAlertController(
        title: "Delete Category",
        message: "Are you sure you want to delete \"\(category.categoryName)\"?",
        preferredStyle: .alert
    )

    alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
    alert.addAction(UIAlertAction(title: "Delete", style: .destructive) { _ in
        Task {
            await viewModel.deleteCategory(category)
        }
    })

    present(alert, animated: true)
}
```

## API Integration Details

### Endpoint Configuration

```swift
enum Endpoint {
    case getCategories
    case createCategory(CreateCategoryRequest)
    case deleteCategory(Int)

    var baseURL: String {
        return "http://34.158.34.129:8080/api"
    }

    var path: String {
        switch self {
        case .getCategories:
            return "/categories"
        case .createCategory:
            return "/categories"
        case .deleteCategory(let id):
            return "/categories/\(id)"
        }
    }

    var method: String {
        switch self {
        case .getCategories:
            return "GET"
        case .createCategory:
            return "POST"
        case .deleteCategory:
            return "DELETE"
        }
    }

    var headers: [String: String] {
        var headers = ["Content-Type": "application/json"]
        if let token = UserDefaults.standard.string(forKey: "authToken") {
            headers["Authorization"] = "Bearer \(token)"
        }
        return headers
    }
}
```

### Request/Response Handling

1. **Success responses**: Parse and update UI
2. **Error handling**:
   - 401: Redirect to login
   - 404: Show "not found" message
   - 500: Show generic error
   - Network error: Show "no connection" message

```swift
enum APIError: LocalizedError {
    case invalidURL
    case noData
    case decodingError
    case unauthorized
    case notFound
    case serverError
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .noData:
            return "No data received"
        case .decodingError:
            return "Failed to parse response"
        case .unauthorized:
            return "Please log in again"
        case .notFound:
            return "Resource not found"
        case .serverError:
            return "Server error occurred"
        case .networkError(let error):
            return error.localizedDescription
        }
    }
}
```

## State Management

### Loading States

- Initial load
- Pull-to-refresh
- Delete operation
- Create operation

### Error States

- Network errors
- Validation errors
- Server errors
- Authentication errors

### Success States

- Categories loaded
- Category created
- Category deleted

## User Experience Enhancements

1. **Animations:**
   - Smooth list updates on delete
   - Fade-in for new items
   - Pull-to-refresh animation
   - Button press feedback

```swift
.animation(.easeInOut, value: categories)
.transition(.move(edge: .trailing).combined(with: .opacity))
```

2. **Haptic Feedback:**
   - Success haptic on create/delete
   - Error haptic on failure
   - Selection feedback on taps

```swift
let generator = UINotificationFeedbackGenerator()
generator.notificationOccurred(.success)
```

3. **Accessibility:**
   - VoiceOver labels for all interactive elements
   - Dynamic type support
   - Color contrast compliance
   - Larger touch targets

```swift
.accessibilityLabel("Delete category")
.accessibilityHint("Double tap to delete this category")
```

4. **Offline Support (Optional):**
   - Cache categories locally with CoreData
   - Queue operations when offline
   - Sync when connection restored

## Error Handling Strategy

1. **Network Errors:**
   - Show user-friendly messages
   - Provide retry option
   - Log technical details for debugging

2. **Validation Errors:**
   - Inline field validation
   - Clear error messages
   - Prevent submission of invalid data

3. **API Errors:**
   - Parse error messages from server
   - Fallback to generic messages
   - Handle token expiration gracefully

```swift
func handleError(_ error: Error) {
    if let apiError = error as? APIError {
        switch apiError {
        case .unauthorized:
            // Redirect to login
            navigateToLogin()
        case .networkError:
            showRetryAlert()
        default:
            showErrorAlert(message: apiError.errorDescription ?? "Unknown error")
        }
    }
}
```

## Testing Strategy

### 1. Unit Tests

```swift
class CategoryViewModelTests: XCTestCase {
    var sut: CategoryListViewModel!
    var mockService: MockCategoryService!

    override func setUp() {
        super.setUp()
        mockService = MockCategoryService()
        sut = CategoryListViewModel(categoryService: mockService)
    }

    func testFetchCategories_Success() async {
        // Given
        let expectedCategories = [Category.mock()]
        mockService.mockCategories = expectedCategories

        // When
        await sut.fetchCategories()

        // Then
        XCTAssertEqual(sut.categories, expectedCategories)
        XCTAssertFalse(sut.isLoading)
        XCTAssertNil(sut.errorMessage)
    }
}
```

### 2. UI Tests

```swift
class CategoryListUITests: XCTestCase {
    func testDeleteCategory() {
        let app = XCUIApplication()
        app.launch()

        // Given - category exists
        let categoryCell = app.cells.firstMatch
        XCTAssertTrue(categoryCell.exists)

        // When - swipe and delete
        categoryCell.swipeLeft()
        app.buttons["Delete"].tap()
        app.alerts.buttons["Delete"].tap()

        // Then - category removed
        XCTAssertFalse(categoryCell.exists)
    }
}
```

### 3. Integration Tests

- API communication
- Error handling
- State transitions

## Security Considerations

1. **Store authentication token securely in Keychain**

```swift
import Security

class KeychainManager {
    static func save(token: String) {
        let data = token.data(using: .utf8)!
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: "authToken",
            kSecValueData as String: data
        ]
        SecItemAdd(query as CFDictionary, nil)
    }
}
```

2. Use HTTPS for all API calls
3. Validate all user input
4. Handle token refresh/expiration
5. Clear sensitive data on logout

## Performance Optimization

1. Lazy load categories if list is large
2. Implement pagination for large datasets
3. Cache API responses appropriately
4. Optimize image/icon loading if used
5. Debounce search if search feature added

```swift
@Published var searchText = "" {
    didSet {
        searchDebouncer.debounce {
            self.performSearch()
        }
    }
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1)

- ✅ Set up networking layer
- ✅ Create data models
- ✅ Build API client
- ✅ Implement error handling

### Phase 2: Core UI (Week 2)

- ✅ Category list screen with SwiftUI/UIKit
- ✅ Empty state view
- ✅ Basic navigation structure
- ✅ Pull-to-refresh functionality

### Phase 3: CRUD Operations (Week 3)

- ✅ Add category functionality
- ✅ Delete category functionality
- ✅ Form validation
- ✅ Loading states

### Phase 4: Polish (Week 4)

- ✅ Error handling improvements
- ✅ Animations and transitions
- ✅ Haptic feedback
- ✅ Accessibility improvements
- ✅ Dark mode support

### Phase 5: Testing & Refinement (Week 5)


### Phase 1: Foundation (Week 1)

- ✅ Set up networking layer
- ✅ Create data models
- ✅ Build API client
- ✅ Implement error handling

### Phase 2: Core UI (Week 2)

- ✅ Category list screen with SwiftUI/UIKit
- ✅ Empty state view
- ✅ Basic navigation structure
- ✅ Pull-to-refresh functionality

### Phase 3: CRUD Operations (Week 3)

- ✅ Add category functionality
- ✅ Delete category functionality
- ✅ Form validation
- ✅ Loading states

### Phase 4: Polish (Week 4)

- ✅ Error handling improvements
- ✅ Animations and transitions
- ✅ Haptic feedback
- ✅ Accessibility improvements
- ✅ Dark mode support

### Phase 5: Testing & Refinement (Week 5)

- ✅ Write unit tests
- ✅ Write UI tests
- ✅ Fix bugs
- ✅ Optimize performance
- ✅ User acceptance testing

## Code Structure

```
MoneyManageApp/
├── App/
│   ├── AppDelegate.swift
│   └── SceneDelegate.swift
├── Models/
│   ├── Category.swift
│   └── APIResponse.swift
├── Networking/
│   ├── APIClient.swift
│   ├── Endpoint.swift
│   ├── APIError.swift
│   └── Services/
│       └── CategoryService.swift
├── ViewModels/
│   ├── CategoryListViewModel.swift
│   └── AddCategoryViewModel.swift
├── Views/
│   ├── CategoryList/
│   │   ├── CategoryListView.swift
│   │   ├── CategoryCell.swift
│   │   └── EmptyStateView.swift
│   └── AddCategory/
│       └── AddCategoryView.swift
├── Utilities/
│   ├── KeychainManager.swift
│   └── Extensions.swift
└── Resources/
    ├── Assets.xcassets
    └── Localization/
```

## Additional Features to Consider

1. **Search functionality** - Filter categories by name
2. **Edit category** - Update existing categories
3. **Category icons** - Visual representation
4. **Category colors** - Color coding for better UX
5. **Usage statistics** - Show transaction count per category
6. **Sorting options** - Sort by name, date, usage
7. **Offline mode** - Full offline support with sync
8. **Bulk operations** - Delete multiple categories at once

## Conclusion

This implementation plan provides a comprehensive roadmap for building a robust, user-friendly category management feature in iOS using Swift. Follow modern iOS development best practices, maintain clean architecture with MVVM, and ensure excellent user experience through proper error handling, loading states, and accessibility support.
